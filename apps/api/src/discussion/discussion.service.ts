import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import type { JwtUser } from '../auth/jwt-user.interface.js';
import { PrismaService } from '../prisma/prisma.service.js';

import { CreateDiscussionPostDto } from './dto/create-post.dto.js';
import { UpdateDiscussionPostDto } from './dto/update-post.dto.js';
import { CreateDiscussionReplyDto } from './dto/create-reply.dto.js';
import { DiscussionReactionDto } from './dto/reaction.dto.js';
import { DiscussionVoteDto } from './dto/vote.dto.js';
import { DiscussionReportDto } from './dto/report.dto.js';

@Injectable()
export class DiscussionService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  private normalizeTenant(
    value?: string | null,
  ) {
    const raw = (value || '')
      .trim()
      .toUpperCase()
      .replace(/&/g, ' AND ')
      .replace(/[^A-Z0-9]+/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');

    const aliases: Record<string, string> = {
      UNIVERSITY: 'UNIVERSITY_COLLEGE',
      UNIVERSITY_COLLEGE: 'UNIVERSITY_COLLEGE',
      UNIVERSITY_AND_COLLEGE: 'UNIVERSITY_COLLEGE',
      SKILL_ACADEMY: 'SKILL_ACADEMY',
      BOOTCAMP: 'BOOTCAMP',
      CORPORATE: 'CORPORATE',
      GOVERNMENT: 'GOVERNMENT',
      GOVT: 'GOVERNMENT',
      NGO: 'NGO',
      NONPROFIT: 'NGO',
      NONPROFIT_ORGANIZATION: 'NGO',
      NGO_NONPROFIT_ORGANIZATION: 'NGO',
    };

    return aliases[raw] || raw;
  }

  private normalizeRole(
    value?: string | null,
  ) {
    const raw = (value || '')
      .trim()
      .toUpperCase()
      .replace(/&/g, ' AND ')
      .replace(/[^A-Z0-9]+/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');

    if (
      raw === 'SUPER_ADMIN' ||
      raw === 'SUPER_ADMINS'
    ) {
      return 'SUPER_ADMIN';
    }

    if (
      raw === 'PLATFORM_ADMIN' ||
      raw === 'PLATFORM_ADMINS'
    ) {
      return 'PLATFORM_ADMIN';
    }

    if (
      [
        'TENANT_ADMIN',
        'TENANT_ADMINS',
        'INSTITUTE_ADMIN',
        'INSTITUTE_ADMINS',
        'ACADEMY_ADMIN',
        'ACADEMY_ADMINS',
        'BOOTCAMP_ADMIN',
        'BOOTCAMP_ADMINS',
        'CORPORATE_ADMIN',
        'CORPORATE_ADMINS',
        'DEPARTMENT_ADMIN',
        'DEPARTMENT_ADMINS',
        'NGO_ADMIN',
        'NGO_ADMINS',
      ].includes(raw)
    ) {
      return 'TENANT_ADMIN';
    }

    if (
      [
        'COORDINATOR',
        'COORDINATORS',
        'PROGRAM_COORDINATOR',
        'PROGRAM_COORDINATORS',
        'COHORT_COORDINATOR',
        'COHORT_COORDINATORS',
        'L_AND_D_COORDINATOR',
        'L_AND_D_COORDINATORS',
        'LD_COORDINATOR',
        'LD_COORDINATORS',
      ].includes(raw)
    ) {
      return 'COORDINATOR';
    }

    if (
      [
        'FACULTY',
        'FACULTIES',
        'TRAINER',
        'TRAINERS',
        'INSTRUCTOR',
        'INSTRUCTORS',
        'MANAGER',
        'MANAGERS',
        'SUPERVISOR',
        'SUPERVISORS',
      ].includes(raw)
    ) {
      return 'FACULTY';
    }

    if (
      [
        'LEARNER',
        'LEARNERS',
        'STUDENT',
        'STUDENTS',
        'EMPLOYEE',
        'EMPLOYEES',
        'TRAINEE',
        'TRAINEES',
        'VOLUNTEER',
        'VOLUNTEERS',
        'OFFICER',
        'OFFICERS',
        'MEMBER',
        'MEMBERS',
        'VOLUNTEER_LEARNER',
        'VOLUNTEER_OR_LEARNER',
      ].includes(raw)
    ) {
      return 'LEARNER';
    }

    return raw;
  }

  private getIdentity(
    user: JwtUser,
  ) {
    return {
      userId: user.userId,
      role: this.normalizeRole(
        user.role,
      ),
      tenantType:
        this.normalizeTenant(
          user.tenantType,
        ),
    };
  }

  private pollOptionTexts(
    value: unknown,
  ): string[] {
    if (!Array.isArray(value)) {
      return [];
    }

    return value
      .map((item) =>
        typeof item === 'string'
          ? item.trim()
          : '',
      )
      .filter(Boolean);
  }

  private async getVisiblePost(
    id: string,
    user: JwtUser,
  ) {
    const identity =
      this.getIdentity(user);

    const post =
      await this.prisma
        .discussionPost
        .findFirst({
          where: {
            id,
            tenantType:
              identity.tenantType,
          },

          include: {
            replies: {
              include: {
                children: {
                  include: {
                    reactions: true,
                  },
                },
                reactions: true,
              },
              orderBy: {
                createdAt: 'asc',
              },
            },

            reactions: true,
            votes: true,
          },
        });

    if (!post) {
      throw new NotFoundException(
        'Discussion post not found',
      );
    }

    return post;
  }

  private async getEditablePost(
    id: string,
    user: JwtUser,
  ) {
    const identity =
      this.getIdentity(user);

    const post =
      await this.prisma
        .discussionPost
        .findFirst({
          where: {
            id,
            tenantType:
              identity.tenantType,
          },
        });

    if (!post) {
      throw new NotFoundException(
        'Discussion post not found',
      );
    }

    const isOwner =
      post.authorId ===
      identity.userId;

    const isAdmin = [
      'SUPER_ADMIN',
      'PLATFORM_ADMIN',
      'TENANT_ADMIN',
    ].includes(
      identity.role,
    );

    if (!isOwner && !isAdmin) {
      throw new ForbiddenException(
        'You can only modify your own discussion post.',
      );
    }

    return post;
  }

  // Kept only so the existing controller route does not need to change.
  // Communities/scopes now come from the existing frontend tenant logic.
  async getCommunities(
    _user: JwtUser,
  ) {
    return [];
  }

  async findAll(
    user: JwtUser,
    query: {
      search?: string;
      communityId?: string;
      scopeId?: string;
      type?: string;
      status?: string;
      sort?: string;
    },
  ) {
    const identity =
      this.getIdentity(user);

    const where: any = {
      tenantType:
        identity.tenantType,
    };

    if (
      query.communityId &&
      query.communityId !== 'ALL'
    ) {
      where.communityId =
        query.communityId;
    }

    if (
      query.scopeId &&
      query.scopeId !== 'ALL'
    ) {
      where.scopeId =
        query.scopeId;
    }

    if (
      query.type &&
      query.type !== 'ALL' &&
      query.type !== 'RECENT'
    ) {
      where.type =
        query.type;
    }

    if (
      query.status &&
      query.status !== 'ALL'
    ) {
      if (
        query.status ===
        'UNANSWERED'
      ) {
        where.type =
          'QUESTION';

        where.replies = {
          none: {},
        };
      } else {
        where.status =
          query.status;
      }
    }

    if (
      query.search?.trim()
    ) {
      const search =
        query.search.trim();

      where.OR = [
        {
          title: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          content: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          communityName: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          scopeLabel: {
            contains: search,
            mode: 'insensitive',
          },
        },
      ];
    }

    const posts =
      await this.prisma
        .discussionPost
        .findMany({
          where,

          include: {
            reactions: true,

            replies: {
              include: {
                children: {
                  include: {
                    reactions: true,
                  },
                },
                reactions: true,
              },
              orderBy: {
                createdAt: 'asc',
              },
            },

            votes: true,

            bookmarks: {
              where: {
                userId:
                  identity.userId,
              },
              select: {
                id: true,
              },
            },

            follows: {
              where: {
                userId:
                  identity.userId,
              },
              select: {
                id: true,
              },
            },

            _count: {
              select: {
                replies: true,
                reactions: true,
                bookmarks: true,
                follows: true,
              },
            },
          },

          orderBy: {
            createdAt: 'desc',
          },
        });

    if (
      query.sort ===
      'MOST_DISCUSSSED'
    ) {
      return [
        ...posts,
      ].sort(
        (a, b) =>
          b._count.replies -
          a._count.replies,
      );
    }

    if (
      query.sort ===
      'TRENDING'
    ) {
      return [
        ...posts,
      ].sort((a, b) => {
        const score = (
          post: typeof a,
        ) => {
          const ageHours =
            Math.max(
              1,
              (
                Date.now() -
                new Date(
                  post.createdAt,
                ).getTime()
              ) /
                3600000,
            );

          return (
            post.viewCount *
              0.08 +
            post._count.replies *
              12 +
            post._count.reactions *
              3 +
            post._count.bookmarks *
              20 +
            post._count.follows *
              16 +
            120 / ageHours
          );
        };

        return (
          score(b) -
          score(a)
        );
      });
    }

    return posts;
  }

  async findOne(
    id: string,
    user: JwtUser,
  ) {
    const post =
      await this.getVisiblePost(
        id,
        user,
      );

    await this.prisma
      .discussionPost
      .update({
        where: {
          id,
        },
        data: {
          viewCount: {
            increment: 1,
          },
        },
      });

    const identity =
      this.getIdentity(user);

    const [
      bookmark,
      follow,
    ] = await Promise.all([
      this.prisma
        .discussionBookmark
        .findUnique({
          where: {
            postId_userId: {
              postId: id,
              userId:
                identity.userId,
            },
          },
        }),

      this.prisma
        .discussionFollow
        .findUnique({
          where: {
            postId_userId: {
              postId: id,
              userId:
                identity.userId,
            },
          },
        }),
    ]);

    return {
      ...post,
      bookmarked:
        !!bookmark,
      following:
        !!follow,
    };
  }

  async create(
    data: CreateDiscussionPostDto,
    user: JwtUser,
  ) {
    const identity =
      this.getIdentity(user);

    if (
      data.type === 'POLL' &&
      (
        !data.poll ||
        data.poll.options.length <
          2
      )
    ) {
      throw new BadRequestException(
        'A poll must contain at least two options.',
      );
    }

    const cleanTags =
      Array.from(
        new Set(
          (data.tags || [])
            .map((tag) =>
              tag
                .trim()
                .replace(/^#/, ''),
            )
            .filter(Boolean),
        ),
      );

    const pollOptions =
      data.type === 'POLL'
        ? (
            data.poll?.options
              .map((option) =>
                option.text.trim(),
              )
              .filter(Boolean) ||
            []
          )
        : [];

    return this.prisma
      .discussionPost
      .create({
        data: {
          tenantType:
            identity.tenantType,

          authorId:
            identity.userId,

          authorRole:
            identity.role,

          type:
            data.type as any,

          title:
            data.title.trim(),

          content:
            data.content,

          communityId:
            data.communityId,

          communityName:
            data.communityName,

          scopeId:
            data.scopeId,

          scopeLabel:
            data.scopeLabel,

          tags:
            cleanTags,

          attachment:
            data.attachment ??
            null,

          resourceUrl:
            data.resourceUrl ??
            null,

          pollOptions:
            data.type === 'POLL'
              ? pollOptions
              : undefined,

          pollMultiple:
            data.poll?.multiple ??
            false,

          pollShowResults:
            data.poll
              ?.showResultsAfterVote ??
            true,

          pollAllowComments:
            data.poll
              ?.allowComments ??
            true,
        },

        include: {
          reactions: true,
          replies: true,
          votes: true,
        },
      });
  }

  async update(
    id: string,
    data: UpdateDiscussionPostDto,
    user: JwtUser,
  ) {
    await this.getEditablePost(
      id,
      user,
    );

    return this.prisma
      .discussionPost
      .update({
        where: {
          id,
        },

        data: {
          ...(data.title !==
          undefined
            ? {
                title:
                  data.title.trim(),
              }
            : {}),

          ...(data.content !==
          undefined
            ? {
                content:
                  data.content,
              }
            : {}),

          ...(data.communityId !==
          undefined
            ? {
                communityId:
                  data.communityId,
              }
            : {}),

          ...(data.scopeId !==
          undefined
            ? {
                scopeId:
                  data.scopeId,
              }
            : {}),

          ...(data.scopeLabel !==
          undefined
            ? {
                scopeLabel:
                  data.scopeLabel,
              }
            : {}),

          ...(data.attachment !==
          undefined
            ? {
                attachment:
                  data.attachment,
              }
            : {}),

          ...(data.resourceUrl !==
          undefined
            ? {
                resourceUrl:
                  data.resourceUrl,
              }
            : {}),
        },
      });
  }

  async remove(
    id: string,
    user: JwtUser,
  ) {
    await this.getEditablePost(
      id,
      user,
    );

    return this.prisma
      .discussionPost
      .delete({
        where: {
          id,
        },
      });
  }

  async addReply(
    postId: string,
    data: CreateDiscussionReplyDto,
    user: JwtUser,
  ) {
    const post =
      await this.getVisiblePost(
        postId,
        user,
      );

    const identity =
      this.getIdentity(user);

    if (
      data.parentReplyId
    ) {
      const parent =
        await this.prisma
          .discussionReply
          .findFirst({
            where: {
              id:
                data.parentReplyId,
              postId,
            },
          });

      if (!parent) {
        throw new BadRequestException(
          'Parent reply was not found.',
        );
      }
    }

    const reply =
      await this.prisma
        .discussionReply
        .create({
          data: {
            postId,

            parentReplyId:
              data.parentReplyId ??
              null,

            authorId:
              identity.userId,

            authorRole:
              identity.role,

            content:
              data.content,
          },
        });

    if (
      post.type ===
        'QUESTION' &&
      post.status === 'OPEN'
    ) {
      await this.prisma
        .discussionPost
        .update({
          where: {
            id: postId,
          },
          data: {
            status:
              'ANSWERED',
          },
        });
    }

    return reply;
  }

  async acceptReply(
    replyId: string,
    user: JwtUser,
  ) {
    const identity =
      this.getIdentity(user);

    const reply =
      await this.prisma
        .discussionReply
        .findUnique({
          where: {
            id: replyId,
          },
          include: {
            post: true,
          },
        });

    if (!reply) {
      throw new NotFoundException(
        'Reply not found.',
      );
    }

    if (
      reply.post
        .tenantType !==
      identity.tenantType
    ) {
      throw new ForbiddenException(
        'You cannot access this reply.',
      );
    }

    if (
      reply.post.type !==
      'QUESTION'
    ) {
      throw new BadRequestException(
        'Only question replies can be accepted as an answer.',
      );
    }

    const canAccept =
      reply.post.authorId ===
        identity.userId ||
      [
        'SUPER_ADMIN',
        'PLATFORM_ADMIN',
        'TENANT_ADMIN',
        'FACULTY',
      ].includes(
        identity.role,
      );

    if (!canAccept) {
      throw new ForbiddenException(
        'You are not allowed to accept this answer.',
      );
    }

    return this.prisma.$transaction(
      async (tx) => {
        await tx.discussionReply
          .updateMany({
            where: {
              postId:
                reply.postId,
            },
            data: {
              accepted: false,
            },
          });

        const acceptedReply =
          await tx
            .discussionReply
            .update({
              where: {
                id: replyId,
              },
              data: {
                accepted: true,
              },
            });

        await tx
          .discussionPost
          .update({
            where: {
              id:
                reply.postId,
            },
            data: {
              status:
                'SOLVED',
            },
          });

        return acceptedReply;
      },
    );
  }

  async react(
    postId: string,
    data: DiscussionReactionDto,
    user: JwtUser,
  ) {
    await this.getVisiblePost(
      postId,
      user,
    );

    const identity =
      this.getIdentity(user);

    if (data.replyId) {
      const reply =
        await this.prisma
          .discussionReply
          .findFirst({
            where: {
              id:
                data.replyId,
              postId,
            },
          });

      if (!reply) {
        throw new BadRequestException(
          'Reply not found.',
        );
      }

      const existing =
        await this.prisma
          .discussionReaction
          .findFirst({
            where: {
              userId:
                identity.userId,
              replyId:
                data.replyId,
            },
          });

      if (existing) {
        return this.prisma
          .discussionReaction
          .update({
            where: {
              id:
                existing.id,
            },
            data: {
              reaction:
                data.reaction,
            },
          });
      }

      return this.prisma
        .discussionReaction
        .create({
          data: {
            tenantType:
              identity.tenantType,
            userId:
              identity.userId,
            replyId:
              data.replyId,
            reaction:
              data.reaction,
          },
        });
    }

    const existing =
      await this.prisma
        .discussionReaction
        .findFirst({
          where: {
            userId:
              identity.userId,
            postId,
            replyId: null,
          },
        });

    if (existing) {
      return this.prisma
        .discussionReaction
        .update({
          where: {
            id:
              existing.id,
          },
          data: {
            reaction:
              data.reaction,
          },
        });
    }

    return this.prisma
      .discussionReaction
      .create({
        data: {
          tenantType:
            identity.tenantType,
          userId:
            identity.userId,
          postId,
          reaction:
            data.reaction,
        },
      });
  }

  async toggleBookmark(
    postId: string,
    user: JwtUser,
  ) {
    await this.getVisiblePost(
      postId,
      user,
    );

    const identity =
      this.getIdentity(user);

    const existing =
      await this.prisma
        .discussionBookmark
        .findUnique({
          where: {
            postId_userId: {
              postId,
              userId:
                identity.userId,
            },
          },
        });

    if (existing) {
      await this.prisma
        .discussionBookmark
        .delete({
          where: {
            id: existing.id,
          },
        });

      return {
        bookmarked: false,
      };
    }

    await this.prisma
      .discussionBookmark
      .create({
        data: {
          tenantType:
            identity.tenantType,
          userId:
            identity.userId,
          postId,
        },
      });

    return {
      bookmarked: true,
    };
  }

  async toggleFollow(
    postId: string,
    user: JwtUser,
  ) {
    await this.getVisiblePost(
      postId,
      user,
    );

    const identity =
      this.getIdentity(user);

    const existing =
      await this.prisma
        .discussionFollow
        .findUnique({
          where: {
            postId_userId: {
              postId,
              userId:
                identity.userId,
            },
          },
        });

    if (existing) {
      await this.prisma
        .discussionFollow
        .delete({
          where: {
            id: existing.id,
          },
        });

      return {
        following: false,
      };
    }

    await this.prisma
      .discussionFollow
      .create({
        data: {
          tenantType:
            identity.tenantType,
          userId:
            identity.userId,
          postId,
        },
      });

    return {
      following: true,
    };
  }

  async vote(
    postId: string,
    data: DiscussionVoteDto,
    user: JwtUser,
  ) {
    const post =
      await this.getVisiblePost(
        postId,
        user,
      );

    const identity =
      this.getIdentity(user);

    if (
      post.type !== 'POLL'
    ) {
      throw new BadRequestException(
        'This post is not a poll.',
      );
    }

    const options =
      this.pollOptionTexts(
        post.pollOptions,
      );

    if (options.length < 2) {
      throw new BadRequestException(
        'This poll has no valid options.',
      );
    }

    const optionIndexes =
      Array.from(
        new Set(
          data.optionIds.map(
            (value) =>
              Number(value),
          ),
        ),
      );

    if (
      optionIndexes.some(
        (index) =>
          !Number.isInteger(index) ||
          index < 0 ||
          index >= options.length,
      )
    ) {
      throw new BadRequestException(
        'Invalid poll option.',
      );
    }

    if (
      !post.pollMultiple &&
      optionIndexes.length !== 1
    ) {
      throw new BadRequestException(
        'This poll allows only one choice.',
      );
    }

    await this.prisma.$transaction(
      async (tx) => {
        await tx
          .discussionPollVote
          .deleteMany({
            where: {
              postId,
              userId:
                identity.userId,
            },
          });

        await tx
          .discussionPollVote
          .createMany({
            data:
              optionIndexes.map(
                (optionIndex) => ({
                  tenantType:
                    identity.tenantType,
                  postId,
                  optionIndex,
                  userId:
                    identity.userId,
                }),
              ),
          });
      },
    );

    return this.prisma
      .discussionPollVote
      .findMany({
        where: {
          postId,
        },
        orderBy: {
          createdAt: 'asc',
        },
      });
  }

  async report(
    postId: string,
    data: DiscussionReportDto,
    user: JwtUser,
  ) {
    await this.getVisiblePost(
      postId,
      user,
    );

    const identity =
      this.getIdentity(user);

    if (data.replyId) {
      const reply =
        await this.prisma
          .discussionReply
          .findFirst({
            where: {
              id:
                data.replyId,
              postId,
            },
          });

      if (!reply) {
        throw new BadRequestException(
          'Reply not found.',
        );
      }
    }

    return this.prisma
      .discussionReport
      .create({
        data: {
          tenantType:
            identity.tenantType,

          reportedBy:
            identity.userId,

          postId,

          replyId:
            data.replyId ??
            null,

          reason:
            data.reason,

          details:
            data.details ??
            null,
        },
      });
  }
}
