"use client";

import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  Trash2,
  ThumbsUp,
  SearchX,
  Search,
  Filter,
  Eye,
  CheckCircle2,
  ChevronDown,
  AtSign,
  BarChart3,
  Bold,
  BookOpen,
  Building2,
  Check,
  CircleHelp,
  Code2,
  GraduationCap,
  Italic,
  Layers3,
  Link2,
  List,
  ListOrdered,
  MessageCircle,
  Paperclip,
  Plus,
  Quote,
  Send,
  Smile,
  Underline,
  Users,
  X,
} from "lucide-react";
import "./discussions.css";

type TenantType = "UNIVERSITY" | "SKILL_ACADEMY" | "CORPORATE" | "NGO" | "GOVERNMENT";
type RoleKey = "SUPER_ADMIN" | "PLATFORM_ADMIN" | "TENANT_ADMIN" | "COORDINATOR" | "MANAGER" | "FACULTY" | "TRAINER" | "STUDENT" | "LEARNER" | "EMPLOYEE" | "OFFICER" | "VOLUNTEER" | "MEMBER";
type PostType = "QUESTION" | "DISCUSSION" | "POLL" | "RESOURCE";
type SortKey = "LATEST" | "TRENDING" | "UNANSWERED" | "MOST_DISCUSSSED";
type StatusKey = "ALL" | "OPEN" | "ANSWERED" | "SOLVED" | "UNANSWERED";
type Screen = "HOME" | "DETAIL" | "NOTIFICATIONS";

type LoginContext = { role?: string; displayRole?: string; tenantType?: string; displayTenant?: string };
type ScopeOption = { id: string; label: string; type: "TENANT" | "DEPARTMENT" | "PROGRAMME" | "COURSE" | "BATCH" | "GROUP" | "ROLE" };
type Community = { id: string; name: string; icon: string; scopes: ScopeOption[] };
type ReplyComment = { id: number; author: string; body: string; time: string };
type Reply = { id: number; author: string; role: string; body: string; time: string; likes: number; accepted?: boolean; comments: ReplyComment[] };
type PollOption = { id: number; text: string; votes: number };
type Post = {
  id: number; tenant: TenantType; type: PostType; title: string; body: string; author: string; authorRole: string;
  communityId: string; communityName: string; scopeId: string; scopeLabel: string; tags: string[]; createdAt: number;
  views: number; reactions: Record<string, number>; replies: Reply[]; status: "OPEN" | "ANSWERED" | "SOLVED" | "CLOSED";
  attachmentName?: string; resourceUrl?: string; following?: boolean; bookmarked?: boolean;
  poll?: { options: PollOption[]; votedOptionIds: number[]; multiple: boolean; showResultsAfterVote: boolean; allowComments: boolean };
};
type NotificationItem = { id: number; type: "REPLY" | "MENTION" | "ACCEPTED" | "POLL" | "FOLLOWED" | "MODERATION"; title: string; message: string; time: string; read: boolean; postId?: number };
type ReportTarget = { kind: "POST" | "REPLY"; id: number; title: string };
type CreateDraft = {
  type: PostType | null; title: string; description: string; tags: string; communityId: string; scopeId: string;
  attachmentName: string; resourceUrl: string; pollQuestion: string; pollOptions: string[]; pollMultiple: boolean;
  pollShowResults: boolean; pollAllowComments: boolean;
};

const REACTIONS = ["👍", "❤️", "👏", "💡", "🎉", "😂"];
const TYPE_OPTIONS = [
  { type: "QUESTION" as PostType, title: "Ask a Question", text: "Get help from the community", icon: "❓" },
  { type: "DISCUSSION" as PostType, title: "Start a Discussion", text: "Share ideas and thoughts", icon: "💬" },
  { type: "POLL" as PostType, title: "Create a Poll", text: "Collect opinions", icon: "📊" },
  { type: "RESOURCE" as PostType, title: "Share a Resource", text: "Share useful resources", icon: "📚" },
];
const POST_LABELS: Record<PostType, { label: string; icon: string; color: string }> = {
  QUESTION: { label: "Question", icon: "❓", color: "blue" },
  DISCUSSION: { label: "Discussion", icon: "💬", color: "green" },
  POLL: { label: "Poll", icon: "📊", color: "purple" },
  RESOURCE: { label: "Resource", icon: "📚", color: "orange" },
};
const REPORT_REASONS = ["Spam", "Harassment", "Inappropriate Content", "Misinformation", "Off Topic", "Copyright", "Other"];

const UI_ICON_SRC = {
  notification: "/assets/calendar-icons/notification.svg",
  search: "/assets/calendar-icons/search.svg",
  filter: "/assets/calendar-icons/filter.svg",
  back: "/assets/calendar-icons/arrow-left.svg",
  sort: "/assets/calendar-icons/arrow-down.svg",
  reply: "/assets/superadminicons/group.svg",
  views: "/assets/superadminicons/chart.svg",
  like: "/assets/superadminicons/thumb-up.svg",
  community: "/assets/superadminicons/group.svg",
  general: "/assets/superadminicons/building.svg",
  learning: "/assets/superadminicons/bookopen.svg",
  dashboard: "/assets/superadminicons/dashboardsquare.svg",
  analytics: "/assets/superadminicons/chart.svg",
  poll: "/assets/superadminicons/clipboard.svg",
};

const POST_ICON_SRC: Record<PostType, string> = {
  QUESTION: "/assets/superadminicons/clipboard.svg",
  DISCUSSION: "/assets/superadminicons/group.svg",
  POLL: "/assets/superadminicons/chart.svg",
  RESOURCE: "/assets/superadminicons/bookopen.svg",
};

function CreatePostTypeIcon({ type }: { type: PostType }) {
  if (type === "QUESTION") return <CircleHelp aria-hidden="true" />;
  if (type === "DISCUSSION") return <MessageCircle aria-hidden="true" />;
  if (type === "POLL") return <BarChart3 aria-hidden="true" />;
  return <BookOpen aria-hidden="true" />;
}

function CreateScopeIcon({ type }: { type: ScopeOption["type"] }) {
  if (type === "TENANT") return <Building2 aria-hidden="true" />;
  if (type === "DEPARTMENT") return <Layers3 aria-hidden="true" />;
  if (type === "COURSE") return <GraduationCap aria-hidden="true" />;
  if (type === "ROLE") return <Users aria-hidden="true" />;
  return <Users aria-hidden="true" />;
}


function communityIconSrc(id: string) {
  if (id.includes("general")) return UI_ICON_SRC.general;
  if (id.includes("data") || id.includes("cloud") || id.includes("learning")) return UI_ICON_SRC.learning;
  if (id.includes("placement")) return UI_ICON_SRC.analytics;
  return UI_ICON_SRC.community;
}


const TENANT_COMMUNITIES: Record<TenantType, Community[]> = {
  UNIVERSITY: [
    { id: "uni-general", name: "General", icon: "🏛️", scopes: [
      { id: "uni-all", label: "Entire College / University", type: "TENANT" },
      { id: "uni-all-students", label: "All Students", type: "ROLE" },
      { id: "uni-all-faculty", label: "All Faculty", type: "ROLE" },
      { id: "uni-coordinators", label: "Department Coordinators", type: "ROLE" },
      { id: "uni-eng-dept", label: "Engineering Department", type: "DEPARTMENT" },
      { id: "uni-cse-dept", label: "Computer Science Department", type: "DEPARTMENT" },
    ]},
    { id: "data-engineering", name: "Data Engineering", icon: "🗄️", scopes: [
      { id: "de-course", label: "Google Cloud Data Engineering", type: "COURSE" },
      { id: "de-batch-a", label: "Batch 2026-A", type: "BATCH" },
      { id: "de-batch-b", label: "Batch 2026-B", type: "BATCH" },
      { id: "de-students", label: "Data Engineering Students", type: "ROLE" },
      { id: "de-faculty", label: "Data Engineering Faculty", type: "ROLE" },
    ]},
    { id: "computer-science", name: "Computer Science", icon: "💻", scopes: [
      { id: "cse-department", label: "Computer Science Department", type: "DEPARTMENT" },
      { id: "ds-course", label: "Data Structures Course", type: "COURSE" },
      { id: "cse-2026", label: "CSE 2026 Cohort", type: "BATCH" },
      { id: "cse-students", label: "Computer Science Students", type: "ROLE" },
      { id: "cse-faculty", label: "Computer Science Faculty", type: "ROLE" },
    ]},
    { id: "placement", name: "Placement Preparation", icon: "🎯", scopes: [
      { id: "placement-all", label: "All Eligible Students", type: "GROUP" },
      { id: "placement-2026", label: "2026 Placement Batch", type: "BATCH" },
      { id: "placement-final-year", label: "Final Year Students", type: "GROUP" },
      { id: "placement-coordinators", label: "Placement Coordinators", type: "ROLE" },
    ]},
  ],

  SKILL_ACADEMY: [
    { id: "academy-general", name: "Academy Community", icon: "🎓", scopes: [
      { id: "academy-all", label: "Entire Skill Academy", type: "TENANT" },
      { id: "academy-learners", label: "All Learners", type: "ROLE" },
      { id: "academy-trainers", label: "All Trainers", type: "ROLE" },
      { id: "academy-coordinators", label: "Programme Coordinators", type: "ROLE" },
      { id: "fullstack-programme", label: "Full Stack Programme", type: "PROGRAMME" },
    ]},
    { id: "full-stack", name: "Full Stack Development", icon: "🧑‍💻", scopes: [
      { id: "fs-cohort-01", label: "Cohort FS-01", type: "BATCH" },
      { id: "fs-cohort-02", label: "Cohort FS-02", type: "BATCH" },
      { id: "react-group", label: "React Practice Group", type: "GROUP" },
      { id: "fs-learners", label: "Full Stack Learners", type: "ROLE" },
      { id: "fs-trainers", label: "Full Stack Trainers", type: "ROLE" },
    ]},
    { id: "cloud-track", name: "Cloud Certification", icon: "☁️", scopes: [
      { id: "cloud-programme", label: "Cloud Certification Programme", type: "PROGRAMME" },
      { id: "aws-cohort", label: "AWS Cohort", type: "BATCH" },
      { id: "cloud-learners", label: "Cloud Learners", type: "ROLE" },
      { id: "cloud-trainers", label: "Cloud Trainers", type: "ROLE" },
    ]},
  ],

  CORPORATE: [
    { id: "company-general", name: "Company Community", icon: "🏢", scopes: [
      { id: "company-all", label: "Entire Organization", type: "TENANT" },
      { id: "company-employees", label: "All Employees", type: "ROLE" },
      { id: "company-managers", label: "All Managers", type: "ROLE" },
      { id: "company-ld-team", label: "L&D Team", type: "ROLE" },
      { id: "engineering-unit", label: "Engineering Business Unit", type: "DEPARTMENT" },
    ]},
    { id: "learning-development", name: "Learning & Development", icon: "📘", scopes: [
      { id: "leadership-programme", label: "Leadership Programme", type: "PROGRAMME" },
      { id: "new-joiners", label: "New Joiners Cohort", type: "GROUP" },
      { id: "ld-managers", label: "Managers", type: "ROLE" },
      { id: "ld-employees", label: "Employees", type: "ROLE" },
      { id: "ld-trainers", label: "Trainers / Facilitators", type: "ROLE" },
    ]},
    { id: "engineering-community", name: "Engineering", icon: "⚙️", scopes: [
      { id: "engineering-business-unit", label: "Engineering Business Unit", type: "DEPARTMENT" },
      { id: "frontend-team", label: "Frontend Employees", type: "GROUP" },
      { id: "backend-team", label: "Backend Employees", type: "GROUP" },
      { id: "engineering-managers", label: "Engineering Managers", type: "ROLE" },
      { id: "engineering-leads", label: "Technical Leads", type: "ROLE" },
    ]},
  ],

  NGO: [
    { id: "ngo-general", name: "Organization Community", icon: "🤝", scopes: [
      { id: "ngo-all", label: "Entire NGO", type: "TENANT" },
      { id: "ngo-volunteers", label: "All Volunteers", type: "ROLE" },
      { id: "ngo-staff", label: "Staff Members", type: "ROLE" },
      { id: "ngo-coordinators", label: "Programme Coordinators", type: "ROLE" },
      { id: "volunteer-group", label: "Volunteer Group", type: "GROUP" },
    ]},
    { id: "skills-programme", name: "Skills Programme", icon: "🧩", scopes: [
      { id: "skills-programme-all", label: "Skills Programme", type: "PROGRAMME" },
      { id: "field-cohort", label: "Field Cohort", type: "BATCH" },
      { id: "programme-participants", label: "Programme Participants", type: "GROUP" },
      { id: "field-trainers", label: "Field Trainers", type: "ROLE" },
      { id: "project-team", label: "Project Team", type: "GROUP" },
    ]},
  ],

  GOVERNMENT: [
    { id: "gov-general", name: "Department Community", icon: "🏛️", scopes: [
      { id: "gov-all", label: "Entire Department / Organization", type: "TENANT" },
      { id: "gov-officers", label: "All Officers", type: "ROLE" },
      { id: "gov-department-heads", label: "Department Heads", type: "ROLE" },
      { id: "gov-training-coordinators", label: "Training Coordinators", type: "ROLE" },
      { id: "digital-services", label: "Digital Services Department", type: "DEPARTMENT" },
    ]},
    { id: "officer-training", name: "Officer Training", icon: "📋", scopes: [
      { id: "officer-programme", label: "Officer Training Programme", type: "PROGRAMME" },
      { id: "officer-cohort", label: "Officer Cohort 2026", type: "BATCH" },
      { id: "training-officers", label: "Officers", type: "ROLE" },
      { id: "government-trainers", label: "Trainers / Facilitators", type: "ROLE" },
      { id: "training-coordinators", label: "Training Coordinators", type: "ROLE" },
    ]},
  ],
};

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  { id: 1, type: "REPLY", title: "New reply to your question", message: "Ananya Rao replied to your question.", time: "5 min ago", read: false, postId: 101 },
  { id: 2, type: "POLL", title: "Poll activity", message: "Your poll received new votes.", time: "1 hour ago", read: false, postId: 103 },
  { id: 3, type: "MENTION", title: "You were mentioned", message: "Vikram Patel mentioned you in a discussion.", time: "2 hours ago", read: true, postId: 102 },
  { id: 4, type: "FOLLOWED", title: "Followed discussion updated", message: "A discussion you follow received a new reply.", time: "Yesterday", read: true, postId: 104 },
];

function nowMinus(minutes: number) { return Date.now() - minutes * 60 * 1000; }
function normalizeTenant(value?: string): TenantType {
  const v = (value || "").toUpperCase();
  if (v.includes("SKILL")) return "SKILL_ACADEMY";
  if (v.includes("CORPORATE")) return "CORPORATE";
  if (v.includes("NGO")) return "NGO";
  if (v.includes("GOVERNMENT")) return "GOVERNMENT";
  return "UNIVERSITY";
}
function normalizeRole(value?: string): RoleKey {
  const v = (value || "").toUpperCase();
  if (v.includes("SUPER")) return "SUPER_ADMIN";
  if (v.includes("PLATFORM")) return "PLATFORM_ADMIN";
  if (v.includes("ADMIN")) return "TENANT_ADMIN";
  if (v.includes("COORDINATOR")) return "COORDINATOR";
  if (v.includes("MANAGER")) return "MANAGER";
  if (v.includes("FACULTY")) return "FACULTY";
  if (v.includes("TRAINER")) return "TRAINER";
  if (v.includes("STUDENT")) return "STUDENT";
  if (v.includes("EMPLOYEE")) return "EMPLOYEE";
  if (v.includes("OFFICER")) return "OFFICER";
  if (v.includes("VOLUNTEER")) return "VOLUNTEER";
  if (v.includes("MEMBER")) return "MEMBER";
  return "LEARNER";
}
function actorLabel(role: RoleKey) { return role.replaceAll("_", " "); }
function timeAgo(timestamp: number) {
  const mins = Math.max(1, Math.floor((Date.now() - timestamp) / 60000));
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}
function pollResultColor(percent: number) {
  if (percent >= 67) return "#2f9e62"; // Green: high result
  if (percent >= 34) return "#2d4cc8"; // Blue: medium result
  return "#d9534f"; // Red: low result
}

function scoreTrending(post: Post) {
  const reactions = Object.values(post.reactions).reduce((a, b) => a + b, 0);
  const ageHours = Math.max(1, (Date.now() - post.createdAt) / 3600000);
  return post.views * .08 + post.replies.length * 12 + reactions * 3 + (post.bookmarked ? 20 : 0) + (post.following ? 16 : 0) + 120 / ageHours;
}
function canCreateType(role: RoleKey, type: PostType) {
  if (["SUPER_ADMIN","PLATFORM_ADMIN","TENANT_ADMIN","COORDINATOR","MANAGER","FACULTY","TRAINER"].includes(role)) return true;
  if (type === "POLL" && ["STUDENT","LEARNER","VOLUNTEER","MEMBER"].includes(role)) return false;
  return true;
}
function seedPosts(tenant: TenantType, communities: Community[]): Post[] {
  const c1 = communities[0];
  const c2 = communities[Math.min(1, communities.length - 1)];
  const c3 = communities[Math.min(2, communities.length - 1)];

  if (tenant === "UNIVERSITY") {
    return [
      {
        id: 101,
        tenant,
        type: "QUESTION",
        title: "How does BigQuery partition pruning work?",
        body: "I understand the basic concept, but I am confused about how BigQuery decides which partitions need to be scanned. Can someone explain with a practical example?",
        author: "Rahul Sharma",
        authorRole: "Student",
        communityId: c2.id,
        communityName: c2.name,
        scopeId: c2.scopes[0].id,
        scopeLabel: c2.scopes[0].label,
        tags: ["BigQuery", "GCP", "DataEngineering"],
        createdAt: nowMinus(20),
        views: 130,
        reactions: { "👍": 24, "❤️": 7, "💡": 5 },
        status: "SOLVED",
        following: true,
        bookmarked: false,
        attachmentName: "partition-example.png",
        replies: [
          {
            id: 1001,
            author: "Dr. Ananya Rao",
            role: "Faculty",
            body: "Partition pruning scans only partitions matching the filter predicate. Filter directly on the partition column so unrelated partitions can be skipped.",
            time: "18 min ago",
            likes: 23,
            accepted: true,
            comments: [
              {
                id: 2001,
                author: "Rahul Sharma",
                body: "That makes sense. So the filter should use the partition column directly?",
                time: "12 min ago",
              },
            ],
          },
          {
            id: 1002,
            author: "Vikram Patel",
            role: "Student",
            body: "You can also compare bytes processed before running the query. It makes the impact easier to understand.",
            time: "35 min ago",
            likes: 5,
            comments: [],
          },
        ],
      },
      {
        id: 102,
        tenant,
        type: "DISCUSSION",
        title: "Best practices for BigQuery optimization",
        body: "Share useful optimization patterns, query-writing practices and examples that have helped reduce cost and improve performance in student projects.",
        author: "Dr. Ananya Rao",
        authorRole: "Faculty",
        communityId: c2.id,
        communityName: c2.name,
        scopeId: c2.scopes[Math.min(1, c2.scopes.length - 1)].id,
        scopeLabel: c2.scopes[Math.min(1, c2.scopes.length - 1)].label,
        tags: ["BestPractice", "BigQuery", "Students"],
        createdAt: nowMinus(140),
        views: 245,
        reactions: { "👍": 32, "👏": 9 },
        replies: [
          {
            id: 1003,
            author: "Priya Mehta",
            role: "Student",
            body: "I would include a checklist for partitioning, clustering and avoiding SELECT * where possible.",
            time: "1 hour ago",
            likes: 8,
            comments: [],
          },
        ],
        status: "ANSWERED",
        following: false,
        bookmarked: true,
      },
      {
        id: 103,
        tenant,
        type: "POLL",
        title: "Which technology should we practice next?",
        body: "Vote for the next hands-on practice topic for the class.",
        author: "Priya Mehta",
        authorRole: "Student",
        communityId: c1.id,
        communityName: c1.name,
        scopeId: c1.scopes[1]?.id || c1.scopes[0].id,
        scopeLabel: c1.scopes[1]?.label || c1.scopes[0].label,
        tags: ["Poll", "Practice", "Students"],
        createdAt: nowMinus(180),
        views: 520,
        reactions: { "👍": 45, "❤️": 12 },
        replies: [],
        status: "OPEN",
        poll: {
          options: [
            { id: 1, text: "Python (Advanced)", votes: 60 },
            { id: 2, text: "Java", votes: 34 },
            { id: 3, text: "Go", votes: 27 },
            { id: 4, text: "TypeScript", votes: 13 },
          ],
          votedOptionIds: [],
          multiple: false,
          showResultsAfterVote: true,
          allowComments: true,
        },
      },
      {
        id: 104,
        tenant,
        type: "RESOURCE",
        title: "AWS certification preparation resources",
        body: "A curated set of notes, labs and practice resources for students preparing for cloud certification.",
        author: "Prof. Vikram Patel",
        authorRole: "Faculty",
        communityId: c3.id,
        communityName: c3.name,
        scopeId: c3.scopes[0].id,
        scopeLabel: c3.scopes[0].label,
        tags: ["AWS", "Certification", "Resource"],
        createdAt: nowMinus(300),
        views: 390,
        reactions: { "👍": 32, "💡": 10 },
        replies: [],
        status: "OPEN",
        resourceUrl: "https://example.com/university/aws-resource",
        attachmentName: "aws-certification-guide.pdf",
      },
    ];
  }

  if (tenant === "SKILL_ACADEMY") {
    return [
      {
        id: 201,
        tenant,
        type: "QUESTION",
        title: "How should I structure authentication in a React + Node project?",
        body: "I am building the capstone project for our Full Stack programme. What is the best way to organize login, refresh tokens and protected routes?",
        author: "Neha Verma",
        authorRole: "Learner",
        communityId: c2.id,
        communityName: c2.name,
        scopeId: c2.scopes[0].id,
        scopeLabel: c2.scopes[0].label,
        tags: ["React", "NodeJS", "Authentication"],
        createdAt: nowMinus(25),
        views: 164,
        reactions: { "👍": 18, "💡": 11 },
        replies: [
          {
            id: 2101,
            author: "Arjun Nair",
            role: "Trainer",
            body: "Keep access tokens short-lived, store refresh tokens securely and isolate auth logic into middleware and reusable client utilities.",
            time: "20 min ago",
            likes: 16,
            accepted: true,
            comments: [],
          },
        ],
        status: "SOLVED",
        following: true,
        bookmarked: true,
      },
      {
        id: 202,
        tenant,
        type: "DISCUSSION",
        title: "Which project should our cohort build next?",
        body: "Share practical capstone ideas that combine frontend, backend and database skills and can be completed within the next sprint.",
        author: "Arjun Nair",
        authorRole: "Trainer",
        communityId: c2.id,
        communityName: c2.name,
        scopeId: c2.scopes[1]?.id || c2.scopes[0].id,
        scopeLabel: c2.scopes[1]?.label || c2.scopes[0].label,
        tags: ["Capstone", "Cohort", "Project"],
        createdAt: nowMinus(100),
        views: 286,
        reactions: { "👍": 35, "👏": 14 },
        replies: [
          {
            id: 2102,
            author: "Ishita Rao",
            role: "Learner",
            body: "A placement tracker with role-based dashboards would let us practice most of the full-stack concepts.",
            time: "55 min ago",
            likes: 12,
            comments: [],
          },
        ],
        status: "ANSWERED",
        following: false,
        bookmarked: false,
      },
      {
        id: 203,
        tenant,
        type: "POLL",
        title: "Which workshop should we schedule next?",
        body: "Vote for the next live workshop for the academy cohort.",
        author: "Karan Shah",
        authorRole: "Programme Coordinator",
        communityId: c1.id,
        communityName: c1.name,
        scopeId: c1.scopes[1]?.id || c1.scopes[0].id,
        scopeLabel: c1.scopes[1]?.label || c1.scopes[0].label,
        tags: ["Workshop", "Learning", "Poll"],
        createdAt: nowMinus(170),
        views: 412,
        reactions: { "👍": 38, "❤️": 7 },
        replies: [],
        status: "OPEN",
        poll: {
          options: [
            { id: 1, text: "Advanced React", votes: 46 },
            { id: 2, text: "Node.js APIs", votes: 39 },
            { id: 3, text: "AWS Deployment", votes: 31 },
            { id: 4, text: "System Design Basics", votes: 22 },
          ],
          votedOptionIds: [],
          multiple: false,
          showResultsAfterVote: true,
          allowComments: true,
        },
      },
      {
        id: 204,
        tenant,
        type: "RESOURCE",
        title: "Cloud certification practice pack",
        body: "Practice labs, mock tests and revision notes for learners enrolled in the cloud certification track.",
        author: "Meera Joshi",
        authorRole: "Trainer",
        communityId: c3.id,
        communityName: c3.name,
        scopeId: c3.scopes[0].id,
        scopeLabel: c3.scopes[0].label,
        tags: ["Cloud", "Certification", "Practice"],
        createdAt: nowMinus(280),
        views: 344,
        reactions: { "👍": 29, "💡": 13 },
        replies: [],
        status: "OPEN",
        resourceUrl: "https://example.com/academy/cloud-practice",
        attachmentName: "cloud-practice-pack.pdf",
      },
    ];
  }

  if (tenant === "CORPORATE") {
    return [
      {
        id: 301,
        tenant,
        type: "QUESTION",
        title: "How should we optimize our shared component library?",
        body: "Several product squads are using the same UI components. What governance and versioning practices should we follow to keep the library stable?",
        author: "Rahul Menon",
        authorRole: "Employee",
        communityId: c3.id,
        communityName: c3.name,
        scopeId: c3.scopes[1]?.id || c3.scopes[0].id,
        scopeLabel: c3.scopes[1]?.label || c3.scopes[0].label,
        tags: ["Frontend", "Architecture", "Components"],
        createdAt: nowMinus(15),
        views: 198,
        reactions: { "👍": 28, "💡": 9 },
        replies: [
          {
            id: 3101,
            author: "Ananya Rao",
            role: "Engineering Manager",
            body: "Use semantic versioning, clear ownership, deprecation policies and automated visual regression checks before publishing shared components.",
            time: "12 min ago",
            likes: 21,
            accepted: true,
            comments: [],
          },
        ],
        status: "SOLVED",
        following: true,
        bookmarked: false,
      },
      {
        id: 302,
        tenant,
        type: "DISCUSSION",
        title: "What should we improve in our onboarding programme?",
        body: "Share feedback on the first 30 days of onboarding. Focus on product context, mentor support, systems access and learning sessions.",
        author: "Priya Kapoor",
        authorRole: "L&D Manager",
        communityId: c2.id,
        communityName: c2.name,
        scopeId: c2.scopes[1]?.id || c2.scopes[0].id,
        scopeLabel: c2.scopes[1]?.label || c2.scopes[0].label,
        tags: ["Onboarding", "L&D", "NewJoiners"],
        createdAt: nowMinus(95),
        views: 372,
        reactions: { "👍": 41, "👏": 18 },
        replies: [
          {
            id: 3102,
            author: "Amit Desai",
            role: "Employee",
            body: "A role-specific checklist and a buddy session in the first week would make onboarding much smoother.",
            time: "45 min ago",
            likes: 15,
            comments: [],
          },
        ],
        status: "ANSWERED",
        following: false,
        bookmarked: true,
      },
      {
        id: 303,
        tenant,
        type: "POLL",
        title: "Which internal learning session should we run next?",
        body: "Vote for the next company learning session.",
        author: "Sneha Iyer",
        authorRole: "Training Coordinator",
        communityId: c2.id,
        communityName: c2.name,
        scopeId: c2.scopes[3]?.id || c2.scopes[0].id,
        scopeLabel: c2.scopes[3]?.label || c2.scopes[0].label,
        tags: ["Learning", "Employees", "Poll"],
        createdAt: nowMinus(160),
        views: 481,
        reactions: { "👍": 44, "❤️": 11 },
        replies: [],
        status: "OPEN",
        poll: {
          options: [
            { id: 1, text: "AI for Productivity", votes: 72 },
            { id: 2, text: "Leadership Essentials", votes: 48 },
            { id: 3, text: "Cloud Cost Optimization", votes: 36 },
            { id: 4, text: "Secure Coding", votes: 29 },
          ],
          votedOptionIds: [],
          multiple: false,
          showResultsAfterVote: true,
          allowComments: true,
        },
      },
      {
        id: 304,
        tenant,
        type: "RESOURCE",
        title: "Manager toolkit for quarterly development conversations",
        body: "A reusable toolkit for managers covering discussion prompts, growth planning and learning follow-up.",
        author: "Nisha Kulkarni",
        authorRole: "L&D Admin",
        communityId: c2.id,
        communityName: c2.name,
        scopeId: c2.scopes[2]?.id || c2.scopes[0].id,
        scopeLabel: c2.scopes[2]?.label || c2.scopes[0].label,
        tags: ["Managers", "Development", "Toolkit"],
        createdAt: nowMinus(250),
        views: 329,
        reactions: { "👍": 31, "💡": 16 },
        replies: [],
        status: "OPEN",
        resourceUrl: "https://example.com/corporate/manager-toolkit",
        attachmentName: "manager-development-toolkit.pdf",
      },
    ];
  }

  if (tenant === "NGO") {
    return [
      {
        id: 401,
        tenant,
        type: "QUESTION",
        title: "How should we capture field visit feedback consistently?",
        body: "Our volunteer teams submit feedback in different formats. What simple structure can we use so programme coordinators can compare field observations?",
        author: "Asha Thomas",
        authorRole: "Volunteer",
        communityId: c1.id,
        communityName: c1.name,
        scopeId: c1.scopes[1]?.id || c1.scopes[0].id,
        scopeLabel: c1.scopes[1]?.label || c1.scopes[0].label,
        tags: ["FieldWork", "Volunteers", "Feedback"],
        createdAt: nowMinus(30),
        views: 142,
        reactions: { "👍": 19, "💡": 8 },
        replies: [
          {
            id: 4101,
            author: "Meena George",
            role: "Programme Coordinator",
            body: "Use one short template covering location, activity, beneficiary feedback, issue observed and required follow-up.",
            time: "22 min ago",
            likes: 14,
            accepted: true,
            comments: [],
          },
        ],
        status: "SOLVED",
        following: true,
        bookmarked: false,
      },
      {
        id: 402,
        tenant,
        type: "DISCUSSION",
        title: "Ideas to improve volunteer engagement this quarter",
        body: "Share practical ideas for keeping volunteers informed, recognized and connected to programme outcomes.",
        author: "Meena George",
        authorRole: "Programme Coordinator",
        communityId: c1.id,
        communityName: c1.name,
        scopeId: c1.scopes[2]?.id || c1.scopes[0].id,
        scopeLabel: c1.scopes[2]?.label || c1.scopes[0].label,
        tags: ["VolunteerEngagement", "Community", "Programme"],
        createdAt: nowMinus(120),
        views: 238,
        reactions: { "👍": 27, "👏": 12 },
        replies: [
          {
            id: 4102,
            author: "Ravi Kumar",
            role: "Volunteer",
            body: "Monthly impact stories and a short volunteer recognition call would help people stay connected.",
            time: "1 hour ago",
            likes: 9,
            comments: [],
          },
        ],
        status: "ANSWERED",
        following: false,
        bookmarked: true,
      },
      {
        id: 403,
        tenant,
        type: "POLL",
        title: "Which field training topic should we prioritize next?",
        body: "Vote for the next training topic for volunteers and field teams.",
        author: "Farah Khan",
        authorRole: "Field Trainer",
        communityId: c2.id,
        communityName: c2.name,
        scopeId: c2.scopes[1]?.id || c2.scopes[0].id,
        scopeLabel: c2.scopes[1]?.label || c2.scopes[0].label,
        tags: ["Training", "FieldCohort", "Poll"],
        createdAt: nowMinus(175),
        views: 301,
        reactions: { "👍": 33, "❤️": 9 },
        replies: [],
        status: "OPEN",
        poll: {
          options: [
            { id: 1, text: "Community Mobilization", votes: 41 },
            { id: 2, text: "Safeguarding Basics", votes: 38 },
            { id: 3, text: "Field Data Collection", votes: 29 },
            { id: 4, text: "Beneficiary Communication", votes: 24 },
          ],
          votedOptionIds: [],
          multiple: false,
          showResultsAfterVote: true,
          allowComments: true,
        },
      },
      {
        id: 404,
        tenant,
        type: "RESOURCE",
        title: "Field facilitator handbook",
        body: "A practical handbook for programme participants, volunteers and field trainers covering session delivery and reporting.",
        author: "Joseph Mathew",
        authorRole: "Field Trainer",
        communityId: c2.id,
        communityName: c2.name,
        scopeId: c2.scopes[3]?.id || c2.scopes[0].id,
        scopeLabel: c2.scopes[3]?.label || c2.scopes[0].label,
        tags: ["FieldTraining", "Handbook", "Resource"],
        createdAt: nowMinus(290),
        views: 276,
        reactions: { "👍": 26, "💡": 12 },
        replies: [],
        status: "OPEN",
        resourceUrl: "https://example.com/ngo/field-handbook",
        attachmentName: "field-facilitator-handbook.pdf",
      },
    ];
  }

  return [
    {
      id: 501,
      tenant,
      type: "QUESTION",
      title: "How should we document citizen service escalation cases?",
      body: "What minimum information should officers capture when a citizen service request needs escalation to another department?",
      author: "Arun Prasad",
      authorRole: "Officer",
      communityId: c1.id,
      communityName: c1.name,
      scopeId: c1.scopes[1]?.id || c1.scopes[0].id,
      scopeLabel: c1.scopes[1]?.label || c1.scopes[0].label,
      tags: ["CitizenServices", "Officers", "Process"],
      createdAt: nowMinus(18),
      views: 156,
      reactions: { "👍": 21, "💡": 7 },
      replies: [
        {
          id: 5101,
          author: "Kavitha Rao",
          role: "Department Head",
          body: "Capture request ID, citizen issue, current status, reason for escalation, receiving department and expected follow-up date.",
          time: "14 min ago",
          likes: 17,
          accepted: true,
          comments: [],
        },
      ],
      status: "SOLVED",
      following: true,
      bookmarked: false,
    },
    {
      id: 502,
      tenant,
      type: "DISCUSSION",
      title: "Improving digital service delivery across departments",
      body: "Share recurring service-delivery bottlenecks and suggestions for better coordination between departments and officers.",
      author: "Kavitha Rao",
      authorRole: "Department Head",
      communityId: c1.id,
      communityName: c1.name,
      scopeId: c1.scopes[4]?.id || c1.scopes[0].id,
      scopeLabel: c1.scopes[4]?.label || c1.scopes[0].label,
      tags: ["DigitalServices", "Departments", "ServiceDelivery"],
      createdAt: nowMinus(115),
      views: 267,
      reactions: { "👍": 30, "👏": 10 },
      replies: [
        {
          id: 5102,
          author: "Suresh Kumar",
          role: "Officer",
          body: "A shared escalation dashboard and standard turnaround times would help reduce hand-off delays.",
          time: "50 min ago",
          likes: 11,
          comments: [],
        },
      ],
      status: "ANSWERED",
      following: false,
      bookmarked: true,
    },
    {
      id: 503,
      tenant,
      type: "POLL",
      title: "Which officer training module should be scheduled next?",
      body: "Vote for the next training module for the current officer cohort.",
      author: "Deepa Nair",
      authorRole: "Training Coordinator",
      communityId: c2.id,
      communityName: c2.name,
      scopeId: c2.scopes[1]?.id || c2.scopes[0].id,
      scopeLabel: c2.scopes[1]?.label || c2.scopes[0].label,
      tags: ["OfficerTraining", "Cohort", "Poll"],
      createdAt: nowMinus(165),
      views: 348,
      reactions: { "👍": 37, "❤️": 8 },
      replies: [],
      status: "OPEN",
      poll: {
        options: [
          { id: 1, text: "Digital Governance", votes: 52 },
          { id: 2, text: "Public Service Communication", votes: 43 },
          { id: 3, text: "Cybersecurity Awareness", votes: 37 },
          { id: 4, text: "Data-driven Administration", votes: 31 },
        ],
        votedOptionIds: [],
        multiple: false,
        showResultsAfterVote: true,
        allowComments: true,
      },
    },
    {
      id: 504,
      tenant,
      type: "RESOURCE",
      title: "Officer training reference handbook",
      body: "Reference material for officers covering digital governance, service standards and departmental coordination.",
      author: "Ramesh Iyer",
      authorRole: "Trainer / Facilitator",
      communityId: c2.id,
      communityName: c2.name,
      scopeId: c2.scopes[3]?.id || c2.scopes[0].id,
      scopeLabel: c2.scopes[3]?.label || c2.scopes[0].label,
      tags: ["OfficerTraining", "Governance", "Resource"],
      createdAt: nowMinus(275),
      views: 312,
      reactions: { "👍": 28, "💡": 15 },
      replies: [],
      status: "OPEN",
      resourceUrl: "https://example.com/government/officer-handbook",
      attachmentName: "officer-training-handbook.pdf",
    },
  ];
}

export default function DiscussionForumPage() {
  const [login, setLogin] = useState<LoginContext>({ role: "STUDENT", displayRole: "Student", tenantType: "UNIVERSITY", displayTenant: "University & College" });
  const [screen, setScreen] = useState<Screen>("HOME");
  const [posts, setPosts] = useState<Post[]>([]);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"ALL" | "RECENT" | PostType>("ALL");
  const [sort, setSort] = useState<SortKey>("LATEST");
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusKey>("ALL");
  const [communityFilter, setCommunityFilter] = useState("ALL");
  const [scopeFilter, setScopeFilter] = useState("ALL");
  const [showFilters, setShowFilters] = useState(false);
  const [openFilterDropdown, setOpenFilterDropdown] = useState<"COMMUNITY" | "AUDIENCE" | "STATUS" | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [createMenuOpen, setCreateMenuOpen] = useState(false);
  const [createDropdownOpen, setCreateDropdownOpen] = useState<"COMMUNITY" | "AUDIENCE" | null>(null);
  const [selectedPostId, setSelectedPostId] = useState<number | null>(null);
  const [replySort, setReplySort] = useState<"TOP" | "LATEST" | "OLDEST">("TOP");
  const [replyText, setReplyText] = useState("");
  const [replyingToId, setReplyingToId] = useState<number | null>(null);
  const [showReplyEmojiPicker, setShowReplyEmojiPicker] = useState(false);
  const [replyAttachmentName, setReplyAttachmentName] = useState("");
  const replyTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const replyAttachmentInputRef = useRef<HTMLInputElement | null>(null);
  const [notificationFilter, setNotificationFilter] = useState<"ALL" | "UNREAD" | "MENTIONS" | "REPLIES">("ALL");
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);
  const [reportTarget, setReportTarget] = useState<ReportTarget | null>(null);
  const [reportReason, setReportReason] = useState("Spam");
  const [reportDetails, setReportDetails] = useState("");
  const [toast, setToast] = useState("");
  const [postSuccessOpen, setPostSuccessOpen] = useState(false);
  const [deleteConfirmPostId, setDeleteConfirmPostId] = useState<number | null>(null);
  const [editPostOpen, setEditPostOpen] = useState(false);
  const [editPostId, setEditPostId] = useState<number | null>(null);
  const [editPostTitle, setEditPostTitle] = useState("");
  const [editPostBody, setEditPostBody] = useState("");
  const [editPostTags, setEditPostTags] = useState("");
  const [draft, setDraft] = useState<CreateDraft>({ type:null,title:"",description:"",tags:"",communityId:"",scopeId:"",attachmentName:"",resourceUrl:"",pollQuestion:"",pollOptions:["",""],pollMultiple:false,pollShowResults:true,pollAllowComments:true });
  const descriptionRef = useRef<HTMLDivElement | null>(null);
  const attachmentInputRef = useRef<HTMLInputElement | null>(null);
  const savedEditorRangeRef = useRef<Range | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [editorState, setEditorState] = useState({
    bold: false,
    italic: false,
    underline: false,
    ordered: false,
    bullet: false,
    quote: false,
    code: false,
  });

  function syncDescriptionFromEditor() {
    const editor = descriptionRef.current;
    if (!editor) return;

    setDraft((current) => ({
      ...current,
      description: editor.innerHTML,
    }));
  }

  function saveEditorSelection() {
    const editor = descriptionRef.current;
    const selection = window.getSelection();

    if (!editor || !selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    const node =
      range.commonAncestorContainer.nodeType === Node.ELEMENT_NODE
        ? (range.commonAncestorContainer as Element)
        : range.commonAncestorContainer.parentElement;

    if (!node || !editor.contains(node)) return;

    savedEditorRangeRef.current = range.cloneRange();
  }

  function restoreEditorSelection() {
    const editor = descriptionRef.current;
    const selection = window.getSelection();

    if (!editor || !selection) return false;

    editor.focus();

    if (savedEditorRangeRef.current) {
      selection.removeAllRanges();
      selection.addRange(savedEditorRangeRef.current.cloneRange());
      return true;
    }

    const range = document.createRange();
    range.selectNodeContents(editor);
    range.collapse(false);

    selection.removeAllRanges();
    selection.addRange(range);
    savedEditorRangeRef.current = range.cloneRange();

    return true;
  }

  function selectionInsideEditor() {
    const editor = descriptionRef.current;
    const selection = window.getSelection();

    if (!editor || !selection || selection.rangeCount === 0) return null;

    const range = selection.getRangeAt(0);
    const node =
      range.commonAncestorContainer.nodeType === Node.ELEMENT_NODE
        ? (range.commonAncestorContainer as Element)
        : range.commonAncestorContainer.parentElement;

    if (!node || !editor.contains(node)) return null;

    return { editor, selection, range };
  }

  function resetInlineTypingState() {
    // Ensure future typing is not accidentally kept bold/italic/underlined.
    try {
      if (document.queryCommandState("bold")) {
        document.execCommand("bold", false);
      }
      if (document.queryCommandState("italic")) {
        document.execCommand("italic", false);
      }
      if (document.queryCommandState("underline")) {
        document.execCommand("underline", false);
      }
    } catch {
      // Browser may not expose command state consistently; normal editor CSS
      // still keeps root typing normal.
    }
  }

  function applySelectedInline(
    command: "bold" | "italic" | "underline",
    label: string
  ) {
    restoreEditorSelection();

    const data = selectionInsideEditor();
    if (!data) {
      showToast("Place the cursor inside the description first.");
      return;
    }

    const { selection, range } = data;

    if (range.collapsed) {
      showToast(`Select text first, then click ${label}.`);
      return;
    }

    document.execCommand(command, false);

    // Move to the end of the selected range.
    selection.collapseToEnd();

    // Turn the inline mode off for whatever the user types next.
    resetInlineTypingState();

    saveEditorSelection();
    syncDescriptionFromEditor();
  }

  function applyListCommand(command: "insertOrderedList" | "insertUnorderedList") {
    restoreEditorSelection();

    const data = selectionInsideEditor();
    if (!data) {
      showToast("Place the cursor inside the description first.");
      return;
    }

    document.execCommand(command, false);
    saveEditorSelection();
    syncDescriptionFromEditor();
  }

  function applyBlockCommand(tag: "blockquote" | "pre") {
    restoreEditorSelection();

    const data = selectionInsideEditor();
    if (!data) {
      showToast("Place the cursor inside the description first.");
      return;
    }

    const { range } = data;
    const node =
      range.commonAncestorContainer.nodeType === Node.ELEMENT_NODE
        ? (range.commonAncestorContainer as Element)
        : range.commonAncestorContainer.parentElement;

    const activeBlock = node?.closest("blockquote, pre");
    const isSameBlock =
      activeBlock &&
      activeBlock.tagName.toLowerCase() === tag;

    document.execCommand("formatBlock", false, isSameBlock ? "p" : tag);

    saveEditorSelection();
    syncDescriptionFromEditor();
  }

  function insertEditorLink() {
    restoreEditorSelection();

    const data = selectionInsideEditor();
    if (!data) {
      showToast("Place the cursor inside the description first.");
      return;
    }

    const selectedText = data.range.toString().trim();
    const url = window.prompt("Enter the web link", "https://");

    if (!url) return;

    restoreEditorSelection();

    if (selectedText) {
      document.execCommand("createLink", false, url);

      const selection = window.getSelection();
      if (selection && selection.anchorNode) {
        const parent =
          selection.anchorNode.nodeType === Node.ELEMENT_NODE
            ? (selection.anchorNode as Element)
            : selection.anchorNode.parentElement;

        const anchor = parent?.closest("a");
        if (anchor) {
          anchor.setAttribute("target", "_blank");
          anchor.setAttribute("rel", "noopener noreferrer");
        }
      }
    } else {
      document.execCommand(
        "insertHTML",
        false,
        `<a href="${url.replace(/"/g, "&quot;")}" target="_blank" rel="noopener noreferrer">${url}</a>&nbsp;`
      );
    }

    saveEditorSelection();
    syncDescriptionFromEditor();
  }

  function insertMention() {
    restoreEditorSelection();

    const data = selectionInsideEditor();
    if (!data) {
      showToast("Place the cursor inside the description first.");
      return;
    }

    const selected = data.range.toString().trim().replace(/^@+/, "");

    if (selected) {
      document.execCommand("insertText", false, `@${selected} `);
    } else {
      document.execCommand("insertText", false, "@");
    }

    saveEditorSelection();
    syncDescriptionFromEditor();
  }

  function insertEmoji(emoji: string) {
    restoreEditorSelection();
    document.execCommand("insertText", false, emoji);

    saveEditorSelection();
    syncDescriptionFromEditor();
    setShowEmojiPicker(false);
  }








  function runEditorAction(action: string) {
    switch (action) {
      case "bold":
        applySelectedInline("bold", "Bold");
        break;

      case "italic":
        applySelectedInline("italic", "Italic");
        break;

      case "underline":
        applySelectedInline("underline", "Underline");
        break;

      case "numbered":
        applyListCommand("insertOrderedList");
        break;

      case "bullet":
        applyListCommand("insertUnorderedList");
        break;

      case "quote":
        applyBlockCommand("blockquote");
        break;

      case "attachment":
        attachmentInputRef.current?.click();
        break;

      case "link":
        insertEditorLink();
        break;

      case "code": {
        restoreEditorSelection();
        const data = selectionInsideEditor();

        if (!data) {
          showToast("Place the cursor inside the description first.");
          break;
        }

        const selectedText = data.range.toString();

        if (selectedText.trim()) {
          const safe = selectedText
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");

          document.execCommand("insertHTML", false, `<code>${safe}</code>`);
          saveEditorSelection();
          syncDescriptionFromEditor();
        } else {
          applyBlockCommand("pre");
        }
        break;
      }

      case "mention":
        insertMention();
        break;

      case "emoji":
        setShowEmojiPicker((open) => !open);
        break;
    }
  }

  function editorButtonMouseDown(
    event: React.MouseEvent<HTMLButtonElement>,
    action: string
  ) {
    // Keep the current editor selection when clicking the toolbar.
    event.preventDefault();
    saveEditorSelection();
    runEditorAction(action);
  }

  function handleEditorKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    // Enter after quote/code/list should behave naturally.
    // Escape returns to a normal paragraph.
    if (event.key === "Escape") {
      event.preventDefault();
      document.execCommand("formatBlock", false, "div");
      resetInlineTypingState();
      saveEditorSelection();
      syncDescriptionFromEditor();
    }
  }

  function plainTextFromHtml(html: string) {
    return html
      .replace(/<br\s*\/?>(?=.)/gi, " ")
      .replace(/<\/p>|<\/div>|<\/li>|<\/blockquote>|<\/pre>/gi, " ")
      .replace(/<[^>]+>/g, "")
      .replace(/&nbsp;/g, " ")
      .trim();
  }

  useEffect(() => { try { const raw = localStorage.getItem("calendar_dummy_login"); if (raw) setLogin(JSON.parse(raw)); } catch {} }, []);
  useEffect(() => {
    if (createOpen && draft.type !== "POLL" && descriptionRef.current) {
      if (descriptionRef.current.innerHTML !== draft.description) {
        descriptionRef.current.innerHTML = draft.description;
      }

      setEditorState({
        bold: false,
        italic: false,
        underline: false,
        ordered: false,
        bullet: false,
        quote: false,
        code: false,
      });
      // Put the caret at the end of the editor root, outside any formatting tag.
      requestAnimationFrame(() => {
        const editor = descriptionRef.current;
        const selection = window.getSelection();

        if (!editor || !selection) return;

        const range = document.createRange();
        range.selectNodeContents(editor);
        range.collapse(false);

        selection.removeAllRanges();
        selection.addRange(range);
      });
    }
  }, [createOpen, draft.type]);

  const tenant = useMemo(() => normalizeTenant(login.tenantType || login.displayTenant), [login.tenantType, login.displayTenant]);
  const role = useMemo(() => normalizeRole(login.role || login.displayRole), [login.role, login.displayRole]);
  const communities = TENANT_COMMUNITIES[tenant];

  useEffect(() => {
    try {
      const key = `discussion_demo_posts_${tenant}`;
      const stored = localStorage.getItem(key);
      const seeded = seedPosts(tenant, communities);

      if (!stored) {
        setPosts(seeded);
        return;
      }

      const savedPosts: Post[] = JSON.parse(stored);

      // Keep manually-created posts, but refresh demo posts from the latest
      // tenant-specific seed data. This prevents older cached demo data from
      // breaking Community / Target Audience filtering after code updates.
      const manualPosts = savedPosts.filter(
        (post) =>
          post.author === "Current User" ||
          post.id > 1000000000000
      );

      setPosts([...manualPosts, ...seeded]);
    } catch {
      setPosts(seedPosts(tenant, communities));
    }
  }, [tenant, communities]);
  useEffect(() => { if (posts.length) try { localStorage.setItem(`discussion_demo_posts_${tenant}`, JSON.stringify(posts)); } catch {} }, [posts, tenant]);

  // A filter selected in one tenant must never remain active after logging
  // into another tenant, because community/audience IDs are tenant-specific.
  useEffect(() => {
    setCommunityFilter("ALL");
    setScopeFilter("ALL");
    setStatusFilter("ALL");
    setTypeFilter("ALL");
    setSort("LATEST");
    setSearch("");
    setOpenFilterDropdown(null);
  }, [tenant]);

  const selectedPost = posts.find(p => p.id === selectedPostId) || null;
  const draftCommunity = communities.find(c => c.id === draft.communityId) || null;
  const availableScopes = draftCommunity?.scopes || [];
  const recentPosts = useMemo(() => [...posts].sort((a,b)=>b.createdAt-a.createdAt).slice(0,3), [posts]);
  const unreadCount = notifications.filter(n => !n.read).length;

  const filteredPosts = useMemo(() => {
    let result = posts.filter(post => {
      if (typeFilter !== "ALL" && typeFilter !== "RECENT" && post.type !== typeFilter) return false;
      if (communityFilter !== "ALL" && post.communityId !== communityFilter) return false;
      if (scopeFilter !== "ALL" && post.scopeId !== scopeFilter) return false;
      if (statusFilter === "OPEN" && post.status !== "OPEN") return false;
      if (statusFilter === "ANSWERED" && post.status !== "ANSWERED") return false;
      if (statusFilter === "SOLVED" && post.status !== "SOLVED") return false;
      if (statusFilter === "UNANSWERED" && !(post.type === "QUESTION" && post.replies.length === 0)) return false;
      const q = search.trim().toLowerCase();
      if (q) {
        const text = [
          post.title,
          plainTextFromHtml(post.body),
          post.author,
          post.authorRole,
          post.communityName,
          post.scopeLabel,
          post.attachmentName || "",
          post.resourceUrl || "",
          ...post.tags,
          ...post.replies.flatMap(r => [r.author, r.role, r.body, ...r.comments.map(c => `${c.author} ${c.body}`)]),
          ...(post.poll?.options.map(option => option.text) || []),
        ].join(" ").toLowerCase();
        if (!text.includes(q)) return false;
      }
      return true;
    });
    if (typeFilter === "RECENT") {
      return [...result].sort((a,b)=>b.createdAt-a.createdAt).slice(0,3);
    }
    if (sort === "LATEST") result = [...result].sort((a,b)=>b.createdAt-a.createdAt);
    if (sort === "TRENDING") result = [...result].sort((a,b)=>scoreTrending(b)-scoreTrending(a));
    if (sort === "UNANSWERED") result = result.filter(p=>p.type === "QUESTION" && p.replies.length === 0);
    if (sort === "MOST_DISCUSSSED") result = [...result].sort((a,b)=>b.replies.length-a.replies.length);
    return result;
  }, [posts,typeFilter,communityFilter,scopeFilter,statusFilter,search,sort]);

  const visibleNotifications = notifications.filter(n => notificationFilter === "ALL" || (notificationFilter === "UNREAD" && !n.read) || (notificationFilter === "MENTIONS" && n.type === "MENTION") || (notificationFilter === "REPLIES" && ["REPLY","ACCEPTED"].includes(n.type)));
  const allScopes = communities.flatMap(c =>
    c.scopes.map(s => ({ ...s, communityId: c.id, communityName: c.name }))
  );

  const visibleAudienceScopes =
    communityFilter === "ALL"
      ? allScopes
      : allScopes.filter(scope => scope.communityId === communityFilter);

  const selectedAudience =
    scopeFilter === "ALL"
      ? null
      : visibleAudienceScopes.find(scope => scope.id === scopeFilter) ||
        allScopes.find(scope => scope.id === scopeFilter);

  function showToast(message: string) { setToast(message); window.setTimeout(()=>setToast(""), 2200); }
  function openDetail(id: number) { setSelectedPostId(id); setScreen("DETAIL"); setPosts(items=>items.map(p=>p.id===id?{...p,views:p.views+1}:p)); }
  function resetDraft() {
    setDraft({ type:null,title:"",description:"",tags:"",communityId:"",scopeId:"",attachmentName:"",resourceUrl:"",pollQuestion:"",pollOptions:["",""],pollMultiple:false,pollShowResults:true,pollAllowComments:true });
    setCreateDropdownOpen(null);
  }

  function closeCreate() {
    setCreateOpen(false);
    setCreateDropdownOpen(null);
    resetDraft();
  }

  function openCreateFromMenu(type: PostType) {
    setDraft({
      type,
      title:"",
      description:"",
      tags:"",
      communityId:"",
      scopeId:"",
      attachmentName:"",
      resourceUrl:"",
      pollQuestion:"",
      pollOptions:["",""],
      pollMultiple:false,
      pollShowResults:true,
      pollAllowComments:true,
    });
    setCreateDropdownOpen(null);
    setCreateMenuOpen(false);
    setCreateOpen(true);
  }

  function canEditOrDeletePost(post: Post) {
    const adminRoles: RoleKey[] = ["SUPER_ADMIN", "PLATFORM_ADMIN", "TENANT_ADMIN"];
    return post.author === "Current User" || adminRoles.includes(role);
  }

  function openEditPost(post: Post) {
    if (!canEditOrDeletePost(post)) {
      showToast("You can edit only posts you are permitted to manage.");
      return;
    }

    setEditPostId(post.id);
    setEditPostTitle(post.title);
    setEditPostBody(plainTextFromHtml(post.body));
    setEditPostTags(post.tags.join(", "));
    setEditPostOpen(true);
  }

  function saveEditedPost() {
    if (!editPostId || !editPostTitle.trim()) {
      showToast("Post title is required.");
      return;
    }

    setPosts((items) =>
      items.map((post) =>
        post.id === editPostId
          ? {
              ...post,
              title: editPostTitle.trim(),
              body: editPostBody.trim(),
              tags: editPostTags
                .split(",")
                .map((tag) => tag.trim())
                .filter(Boolean),
            }
          : post
      )
    );

    setEditPostOpen(false);
    setEditPostId(null);
    showToast("Post updated successfully.");
  }

  function deletePost(post: Post) {
    if (!canEditOrDeletePost(post)) {
      showToast("You can delete only posts you are permitted to manage.");
      return;
    }

    setDeleteConfirmPostId(post.id);
  }

  function confirmDeletePost() {
    if (deleteConfirmPostId === null) return;

    const postId = deleteConfirmPostId;

    setPosts((items) => items.filter((item) => item.id !== postId));

    if (selectedPostId === postId) {
      setSelectedPostId(null);
      setScreen("HOME");
    }

    setDeleteConfirmPostId(null);
    setPostSuccessOpen(false);
    showToast("Post deleted successfully.");
  }

  function publishPost() {
    if (!draft.type) return;
    if (draft.type === "POLL") {
      if (!draft.pollQuestion.trim()) return showToast("Enter the poll question.");
      if (draft.pollOptions.filter(Boolean).length < 2) return showToast("Add at least two poll options.");
    } else if (!draft.title.trim() || !plainTextFromHtml(draft.description)) {
      return showToast("Enter title and description.");
    }
    if (!draft.communityId || !draft.scopeId || !draftCommunity) {
      return showToast("Select community and target audience.");
    }
    const scope = draftCommunity.scopes.find(s=>s.id===draft.scopeId);
    if (!scope) return showToast("Select a valid target audience.");
    const post: Post = {
      id: Date.now(), tenant, type: draft.type, title: draft.type === "POLL" ? draft.pollQuestion : draft.title,
      body: draft.description || (draft.type === "POLL" ? "Vote below and share your opinion." : ""), author: "Current User", authorRole: login.displayRole || actorLabel(role),
      communityId:draftCommunity.id,communityName:draftCommunity.name,scopeId:scope.id,scopeLabel:scope.label,tags:draft.tags.split(",").map(x=>x.trim()).filter(Boolean),createdAt:Date.now(),views:0,reactions:{},replies:[],status:"OPEN",
      attachmentName:draft.attachmentName||undefined,resourceUrl:draft.type==="RESOURCE"?(draft.resourceUrl||undefined):undefined,
      poll:draft.type==="POLL"?{options:draft.pollOptions.filter(Boolean).map((text,i)=>({id:i+1,text,votes:0})),votedOptionIds:[],multiple:draft.pollMultiple,showResultsAfterVote:draft.pollShowResults,allowComments:draft.pollAllowComments}:undefined,
    };
    setPosts(items=>[post,...items]);
    setCreateOpen(false);
    resetDraft();
    setSelectedPostId(post.id);
    setScreen("HOME");
    setPostSuccessOpen(true);
  }
  function handleFile(e: ChangeEvent<HTMLInputElement>) { const file=e.target.files?.[0]; if(file) setDraft(d=>({...d,attachmentName:file.name})); }
  function reactToPost(id:number,reaction:string){
    setPosts(items=>items.map(p=>p.id===id?{...p,reactions:{...p.reactions,[reaction]:(p.reactions[reaction]||0)+1}}:p));
    showToast(`${reaction} reaction added.`);
  }
  function toggleFollow(id:number){
    setPosts(items=>items.map(p=>p.id===id?{...p,following:!p.following}:p));
  }
  function toggleBookmark(id:number){
    setPosts(items=>items.map(p=>p.id===id?{...p,bookmarked:!p.bookmarked}:p));
  }
  function focusReply(replyId?:number){
    setReplyingToId(replyId ?? null);
    window.setTimeout(()=>replyTextareaRef.current?.focus(),0);
  }
  function likeReply(replyId:number){
    if(!selectedPost)return;
    setPosts(items=>items.map(p=>p.id===selectedPost.id?{
      ...p,
      replies:p.replies.map(r=>r.id===replyId?{...r,likes:r.likes+1}:r)
    }:p));
  }
  function addReply(){
    if(!selectedPost)return;
    const body = replyText.trim();
    if(!body && !replyAttachmentName)return;

    const finalBody = `${body}${body&&replyAttachmentName?"\n":""}${replyAttachmentName?`📎 ${replyAttachmentName}`:""}`;

    if(replyingToId){
      const comment: ReplyComment = {
        id:Date.now(),
        author:"Current User",
        body:finalBody,
        time:"Just now"
      };
      setPosts(items=>items.map(p=>p.id===selectedPost.id?{
        ...p,
        replies:p.replies.map(r=>r.id===replyingToId?{...r,comments:[...r.comments,comment]}:r)
      }:p));
      showToast("Reply added to conversation.");
    } else {
      const r:Reply={
        id:Date.now(),
        author:"Current User",
        role:login.displayRole||actorLabel(role),
        body:finalBody,
        time:"Just now",
        likes:0,
        comments:[]
      };
      setPosts(items=>items.map(p=>p.id===selectedPost.id?{
        ...p,
        replies:[...p.replies,r],
        status:p.type==="QUESTION"&&p.status==="OPEN"?"ANSWERED":p.status
      }:p));
      showToast("Reply posted.");
    }

    setReplyText("");
    setReplyAttachmentName("");
    setReplyingToId(null);
    setShowReplyEmojiPicker(false);
    if(replyAttachmentInputRef.current) replyAttachmentInputRef.current.value="";
  }
  function insertReplyText(value:string){
    const el=replyTextareaRef.current;
    if(!el){setReplyText(current=>current+value);return;}
    const start=el.selectionStart??replyText.length;
    const end=el.selectionEnd??replyText.length;
    setReplyText(replyText.slice(0,start)+value+replyText.slice(end));
    window.setTimeout(()=>{
      el.focus();
      const caret=start+value.length;
      el.setSelectionRange(caret,caret);
    },0);
  }
  function insertReplyCode(){
    const el=replyTextareaRef.current;
    if(!el){insertReplyText("```\n\n```");return;}
    const start=el.selectionStart??0;
    const end=el.selectionEnd??0;
    const selected=replyText.slice(start,end);
    const value=selected?`\`${selected}\``:"```\ncode\n```";
    setReplyText(replyText.slice(0,start)+value+replyText.slice(end));
    window.setTimeout(()=>el.focus(),0);
  }
  function handleReplyAttachment(e:ChangeEvent<HTMLInputElement>){
    const file=e.target.files?.[0];
    if(file)setReplyAttachmentName(file.name);
  }
  async function shareSelectedPost(){
    if(!selectedPost)return;
    const title=selectedPost.title;
    const url=window.location.href;
    try{
      if(navigator.share){
        await navigator.share({title,text:title,url});
        showToast("Post shared.");
      }else if(navigator.clipboard){
        await navigator.clipboard.writeText(url);
        showToast("Post link copied.");
      }else{
        showToast("Sharing is not supported in this browser.");
      }
    }catch{
      // User cancelling the native share sheet is not an error for the UI.
    }
  }
  function markAccepted(replyId:number){if(!selectedPost)return;setPosts(items=>items.map(p=>p.id===selectedPost.id?{...p,status:"SOLVED",replies:p.replies.map(r=>({...r,accepted:r.id===replyId}))}:p));showToast("Answer marked as accepted.");}
  function vote(postId:number,optionId:number){setPosts(items=>items.map(post=>{if(post.id!==postId||!post.poll)return post;const old=post.poll.votedOptionIds;let voted=post.poll.multiple?(old.includes(optionId)?old.filter(x=>x!==optionId):[...old,optionId]):[optionId];const options=post.poll.options.map(o=>({...o,votes:Math.max(0,o.votes+(old.includes(o.id)&&!voted.includes(o.id)?-1:0)+(!old.includes(o.id)&&voted.includes(o.id)?1:0))}));return{...post,poll:{...post.poll,votedOptionIds:voted,options}};}));}
  function submitReport(){setReportTarget(null);setReportDetails("");setReportReason("Spam");showToast("Report submitted for review.");}
  function clearFilters(){setSearch("");setTypeFilter("ALL");setSort("LATEST");setStatusFilter("ALL");setCommunityFilter("ALL");setScopeFilter("ALL");}

  return <main className="discussionPage">
    <header className="discussionTopbar">
      <button className="brandButton" onClick={()=>setScreen("HOME")}><span className="brandIcon">D</span><span><b>Discussions</b><small>{login.displayTenant||tenant.replaceAll("_"," ")}</small></span></button>
      <div className="topbarActions"><button className="notificationButton" onClick={()=>setScreen("NOTIFICATIONS")}><img src= "/assets/superadminicons/notification.svg" alt="" />{unreadCount>0&&<span>{unreadCount}</span>}</button><div className="roleChip"><span>{(login.displayRole||actorLabel(role)).slice(0,1)}</span><div><b>{login.displayRole||actorLabel(role)}</b><small>{tenant.replaceAll("_"," ")}</small></div></div></div>
    </header>

    {screen === "HOME" && <>
      <section className="heroSection"><div><p className="eyebrow">Community learning</p><h1>Discussions</h1><p>Ask questions, share knowledge, exchange ideas and learn together.</p></div>
      <div className={`createMenuWrap ${createMenuOpen?"open":""}`}>
        <button className="primaryButton createButton" onClick={()=>setCreateMenuOpen(v=>!v)} aria-expanded={createMenuOpen}>
          <span>＋</span> Create
        </button>
        {createMenuOpen&&<div className="createQuickMenu">
          {TYPE_OPTIONS.filter(x=>canCreateType(role,x.type)).map(x=><button type="button" key={x.type} onClick={()=>openCreateFromMenu(x.type)}>
            <span className="discussionCheck" aria-hidden="true"></span>
            <span className="createQuickCopy"><b>{POST_LABELS[x.type].label}</b><small>{x.text}</small></span>
          </button>)}
        </div>}
      </div>
    </section>

      <section className="discoverPanel">
        <div className="searchRow"><label className="searchBox"><Search size={17} strokeWidth={1.8} aria-hidden="true" /><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search posts, replies, tags, people or communities..."/></label><button className={`softButton filterButton ${showFilters?"active":""}`} onClick={()=>setShowFilters(v=>!v)}><Filter size={16} strokeWidth={1.8} aria-hidden="true" />Filters</button></div>
        {showFilters&&<div className="filterPanel">
          <label>Community
            <div className={`filterDropdown ${openFilterDropdown === "COMMUNITY" ? "open" : ""}`}>
              <button type="button" className="filterDropdownTrigger" onClick={()=>setOpenFilterDropdown(openFilterDropdown === "COMMUNITY" ? null : "COMMUNITY")}>
                <span>{communityFilter === "ALL" ? "All Communities" : communities.find(c=>c.id===communityFilter)?.name || "All Communities"}</span><span className="filterDropdownArrow"><ChevronDown size={15} strokeWidth={1.8} aria-hidden="true" /></span>
              </button>
              {openFilterDropdown === "COMMUNITY"&&<div className="filterDropdownMenu">
                <button type="button" className={communityFilter === "ALL" ? "selected" : ""} onClick={()=>{setCommunityFilter("ALL");setScopeFilter("ALL");setOpenFilterDropdown(null);}}><span className={`discussionCheck ${communityFilter === "ALL" ? "checked" : ""}`} aria-hidden="true"></span><span>All Communities</span></button>
                {communities.map(c=><button type="button" key={c.id} className={communityFilter === c.id ? "selected" : ""} onClick={()=>{setCommunityFilter(c.id);setScopeFilter("ALL");setOpenFilterDropdown(null);}}><span className={`discussionCheck ${communityFilter === c.id ? "checked" : ""}`} aria-hidden="true"></span><span>{c.name}</span></button>)}
              </div>}
            </div>
          </label>
          <label>Target Audience
            <div className={`filterDropdown ${openFilterDropdown === "AUDIENCE" ? "open" : ""}`}>
              <button type="button" className="filterDropdownTrigger" onClick={()=>setOpenFilterDropdown(openFilterDropdown === "AUDIENCE" ? null : "AUDIENCE")}>
                <span>{scopeFilter === "ALL" ? "All Users" : selectedAudience?.label || "All Users"}</span><span className="filterDropdownArrow"><ChevronDown size={15} strokeWidth={1.8} aria-hidden="true" /></span>
              </button>
              {openFilterDropdown === "AUDIENCE"&&<div className="filterDropdownMenu">
                <button type="button" className={scopeFilter === "ALL" ? "selected" : ""} onClick={()=>{setScopeFilter("ALL");setOpenFilterDropdown(null);}}><span className={`discussionCheck ${scopeFilter === "ALL" ? "checked" : ""}`} aria-hidden="true"></span><span>All Users</span></button>
                {visibleAudienceScopes.map(s=><button type="button" key={`${s.communityId}-${s.id}`} className={scopeFilter === s.id ? "selected" : ""} onClick={()=>{setScopeFilter(s.id);setOpenFilterDropdown(null);}}><span className={`discussionCheck ${scopeFilter === s.id ? "checked" : ""}`} aria-hidden="true"></span><span>{s.label}</span></button>)}
              </div>}
            </div>
          </label>
          <label>Status
            <div className={`filterDropdown ${openFilterDropdown === "STATUS" ? "open" : ""}`}>
              <button type="button" className="filterDropdownTrigger" onClick={()=>setOpenFilterDropdown(openFilterDropdown === "STATUS" ? null : "STATUS")}>
                <span>{statusFilter === "ALL" ? "All Status" : statusFilter === "OPEN" ? "Open" : statusFilter === "ANSWERED" ? "Answered" : statusFilter === "SOLVED" ? "Solved" : "Unanswered"}</span><span className="filterDropdownArrow"><ChevronDown size={15} strokeWidth={1.8} aria-hidden="true" /></span>
              </button>
              {openFilterDropdown === "STATUS"&&<div className="filterDropdownMenu">
                {[
                  ["ALL","All Status"],
                  ["OPEN","Open"],
                  ["ANSWERED","Answered"],
                  ["SOLVED","Solved"],
                  ["UNANSWERED","Unanswered"],
                ].map(([value,label])=><button type="button" key={value} className={statusFilter === value ? "selected" : ""} onClick={()=>{setStatusFilter(value as StatusKey);setOpenFilterDropdown(null);}}><span className={`discussionCheck ${statusFilter === value ? "checked" : ""}`} aria-hidden="true"></span><span>{label}</span></button>)}
              </div>}
            </div>
          </label>
          <button className="softButton" onClick={()=>{clearFilters();setOpenFilterDropdown(null);}}>Clear</button>
        </div>}
      </section>

      <div className="homeLayout">
        <aside className="communityRail">
          <div className="railHeading"><div><h3>My Communities</h3><small>Accessible</small></div><span>{communities.length}</span></div>
          <button className={communityFilter==="ALL"?"active":""} onClick={()=>{setCommunityFilter("ALL");setScopeFilter("ALL");}}>
            <span className="communityIcon"><Users size={18} strokeWidth={1.8} aria-hidden="true" /></span>
            <div><b>All Communities</b><small>Everything available to you</small></div>
          </button>
          {communities.map(c=><button key={c.id} className={communityFilter===c.id?"active":""} onClick={()=>{setCommunityFilter(c.id);setScopeFilter("ALL");}}>
            <span className="communityIcon">{c.id.includes("general") ? <Building2 size={18} strokeWidth={1.8} aria-hidden="true" /> : c.id.includes("data") || c.id.includes("cloud") || c.id.includes("learning") ? <BookOpen size={18} strokeWidth={1.8} aria-hidden="true" /> : c.id.includes("placement") ? <BarChart3 size={18} strokeWidth={1.8} aria-hidden="true" /> : <Users size={18} strokeWidth={1.8} aria-hidden="true" />}</span>
            <div><b>{c.name}</b><small>{c.scopes.length} audience scopes</small></div>
          </button>)}
        </aside>

        <section className="feed">
          <div className="feedTypeRow">
            <div className="typeTabs">
              <button className={typeFilter==="ALL"?"active":""} onClick={()=>setTypeFilter("ALL")}>All <small>{posts.length}</small></button>
              {(Object.keys(POST_LABELS) as PostType[]).map(t=><button key={t} className={typeFilter===t?"active":""} onClick={()=>setTypeFilter(t)}>{POST_LABELS[t].label}s <small>{posts.filter(p=>p.type===t).length}</small></button>)}
              <button className={typeFilter==="RECENT"?"active":""} onClick={()=>{setTypeFilter("RECENT");setSort("LATEST");}}>Recent Active <small>{recentPosts.length}</small></button>
            </div>
          </div>
          <div className="feedHeader">
            <div><small>{typeFilter==="RECENT"?"Recent activity":sort==="TRENDING"?"Popular now":"Community feed"}</small><h2>{typeFilter==="RECENT"?"Recently Active":sort==="TRENDING"?"Trending Discussions":"Latest Discussions"}</h2></div>
            <div className="feedHeaderTools">
              <div className="sortControl"><div className={`sortDropdown ${sortDropdownOpen?"open":""}`}>
                <button type="button" className="sortDropdownTrigger" onClick={()=>setSortDropdownOpen(v=>!v)} aria-expanded={sortDropdownOpen}>
                  <span>{sort==="LATEST"?"Latest":sort==="TRENDING"?"Trending":sort==="UNANSWERED"?"Unanswered":"Most Discussed"}</span>
                  <ChevronDown size={15} strokeWidth={1.8} aria-hidden="true" />
                </button>
                {sortDropdownOpen&&<div className="sortDropdownMenu">
                  {([
                    ["LATEST","Latest"],
                    ["TRENDING","Trending"],
                    ["UNANSWERED","Unanswered"],
                    ["MOST_DISCUSSSED","Most Discussed"],
                  ] as [SortKey,string][]).map(([value,label])=><button type="button" key={value} className={sort===value?"selected":""} onClick={()=>{setSort(value);setSortDropdownOpen(false);}}>{label}</button>)}
                </div>}
              </div></div>
            </div>
          </div>
{filteredPosts.length===0?<div className="emptyState"><span><SearchX size={26} strokeWidth={1.6} aria-hidden="true" /></span><h3>No discussions found</h3><p>Try another filter or create a new post.</p></div>:<div className="feedList">{filteredPosts.map(post=>{const rc=Object.values(post.reactions).reduce((a,b)=>a+b,0);return <article className="postCard" key={post.id}>
        <aside className={`postMetricRail ${POST_LABELS[post.type].color}`}>
          <span className="postMetricItem">
            <span className="postMetricTop">
              <span className="postMetricIconButton"><ThumbsUp size={16} strokeWidth={1.8} aria-hidden="true" /></span>
              <small>Likes</small>
            </span>
            <b className="postMetricCountBox">{rc}</b>
          </span>
          <span className="postMetricItem">
            <span className="postMetricTop">
              <span className="postMetricIconButton"><MessageCircle size={16} strokeWidth={1.8} aria-hidden="true" /></span>
              <small>Replies</small>
            </span>
            <b className="postMetricCountBox">{post.replies.length}</b>
          </span>
          <span className="postMetricItem">
            <span className="postMetricTop">
              <span className="postMetricIconButton"><Eye size={16} strokeWidth={1.8} aria-hidden="true" /></span>
              <small>Views</small>
            </span>
            <b className="postMetricCountBox">{post.views}</b>
          </span>
        </aside>
        <div className="postContentColumn">
          <button className="postMain" onClick={()=>openDetail(post.id)}><div className="postTop"><span className={`postType ${POST_LABELS[post.type].color}`}><img src={POST_ICON_SRC[post.type]} alt="" />{POST_LABELS[post.type].label}</span><div className="postTopRight">{post.status==="SOLVED"&&<span className="solvedChip"><CheckCircle2 size={14} strokeWidth={1.8} aria-hidden="true" />Solved</span>}<span className="postTime">{timeAgo(post.createdAt)}</span></div></div><h3>{post.title}</h3><div className="postExcerpt richTextOutput" dangerouslySetInnerHTML={{ __html: post.body }} /><div className="tagRow">{post.tags.map(t=><span key={t}>#{t}</span>)}</div></button>
          {post.poll&&<div className="miniPoll">{post.poll.options.slice(0,3).map(o=>{const total=post.poll!.options.reduce((s,x)=>s+x.votes,0)||1;const pct=Math.round(o.votes/total*100);const pollColor=pollResultColor(pct);return <div key={o.id}><span>{o.text}</span><i><em style={{width:`${pct}%`,backgroundColor:pollColor}}/></i><b style={{color:pollColor}}>{pct}%</b></div>})}</div>}
          <footer className="postFooter"><div className="authorMini"><span className="avatar">{post.author.split(" ").map(x=>x[0]).join("").slice(0,2)}</span><div><b>{post.author}</b><small>{post.authorRole} · {post.communityName} · {post.scopeLabel}</small></div></div></footer>
        </div>
      </article>})}</div>}
        </section>
      </div>
    </>}

    {screen==="DETAIL"&&selectedPost&&<section className="detailPage"><button className="backButton" onClick={()=>setScreen("HOME")}><img src="/assets/calendar-icons/arrowleft.svg" alt="" />Back to Discussions</button><div className="breadcrumb">Discussion <span>›</span> {selectedPost.communityName} <span>›</span> {selectedPost.title}</div>
      <article className="detailCard"><div className="detailHeader"><div><span className={`postType ${POST_LABELS[selectedPost.type].color}`}><img src={POST_ICON_SRC[selectedPost.type]} alt="" />{POST_LABELS[selectedPost.type].label}</span>{selectedPost.status==="SOLVED"&&<span className="solvedChip"><CheckCircle2 size={14} strokeWidth={1.8} aria-hidden="true" />Solved</span>}</div></div><h1>{selectedPost.title}</h1><div className="authorLine"><span className="avatar large">{selectedPost.author.split(" ").map(x=>x[0]).join("").slice(0,2)}</span><div><b>{selectedPost.author}</b><small>{selectedPost.authorRole} · {selectedPost.communityName} · {timeAgo(selectedPost.createdAt)}</small></div></div><div className="detailBodyText richTextOutput" dangerouslySetInnerHTML={{ __html: selectedPost.body }} /><div className="tagRow">{selectedPost.tags.map(t=><span key={t}>#{t}</span>)}</div>{selectedPost.attachmentName&&<button type="button" className="attachmentChip" onClick={()=>showToast(`Demo attachment: ${selectedPost.attachmentName}`)}>📎 {selectedPost.attachmentName}</button>}{selectedPost.resourceUrl&&<a className="resourceBox resourceLink" href={selectedPost.resourceUrl} target="_blank" rel="noopener noreferrer"><span>🔗</span><div><b>Shared Resource</b><small>{selectedPost.resourceUrl}</small></div></a>}
      {selectedPost.poll&&<div className="pollCard">{selectedPost.poll.options.map(o=>{const total=selectedPost.poll!.options.reduce((s,x)=>s+x.votes,0)||1;const pct=Math.round(o.votes/total*100);const pollColor=pollResultColor(pct);const selected=selectedPost.poll!.votedOptionIds.includes(o.id);const show=!selectedPost.poll!.showResultsAfterVote||selectedPost.poll!.votedOptionIds.length>0;return <button key={o.id} className={selected?"selected":""} onClick={()=>vote(selectedPost.id,o.id)}><span className={`discussionCheck pollVoteCheck ${selected?"checked":""}`} aria-hidden="true">{selected&&<Check size={10} strokeWidth={2.2}/>}</span><span className="pollLabel">{o.text}</span>{show&&<><span className="pollTrack"><i style={{width:`${pct}%`,backgroundColor:pollColor}}/></span><b style={{color:pollColor}}>{pct}%</b></>}</button>})}<small>Total Votes: {selectedPost.poll.options.reduce((s,x)=>s+x.votes,0)}</small></div>}
      <div className="detailActions"><div className="reactionBar">{REACTIONS.map(r=><button key={r} onClick={()=>reactToPost(selectedPost.id,r)}>{r} {selectedPost.reactions[r]||0}</button>)}</div><div className="utilityActions"><button className={selectedPost.following?"active":""} onClick={()=>toggleFollow(selectedPost.id)}>☆ {selectedPost.following?"Following":"Follow"}</button><button className={selectedPost.bookmarked?"active":""} onClick={()=>toggleBookmark(selectedPost.id)}>🔖 {selectedPost.bookmarked?"Saved":"Save"}</button><button onClick={shareSelectedPost}>↗ Share</button><button onClick={()=>setReportTarget({kind:"POST",id:selectedPost.id,title:selectedPost.title})}>⚑ Report</button>{canEditOrDeletePost(selectedPost)&&<><button className="editPostButton" onClick={()=>openEditPost(selectedPost)}>✎ Edit</button><button className="deletePostButton" onClick={()=>deletePost(selectedPost)}>🗑 Delete</button></>}</div></div></article>
      {(selectedPost.type!=="POLL"||selectedPost.poll?.allowComments)&&<section className="replySection"><div className="replySectionHeader"><h2>{selectedPost.replies.length} Replies</h2><div className="replySort"><button className={replySort==="TOP"?"active":""} onClick={()=>setReplySort("TOP")}>Top</button><button className={replySort==="LATEST"?"active":""} onClick={()=>setReplySort("LATEST")}>Latest</button><button className={replySort==="OLDEST"?"active":""} onClick={()=>setReplySort("OLDEST")}>Oldest</button></div></div><div className="replyList">{[...selectedPost.replies].sort((a,b)=>replySort==="TOP"?b.likes-a.likes:replySort==="LATEST"?b.id-a.id:a.id-b.id).map(r=><article className={`replyCard ${r.accepted?"accepted":""}`} key={r.id}><div className="authorLine"><span className="avatar">{r.author.split(" ").map(x=>x[0]).join("").slice(0,2)}</span><div><b>{r.author}</b><small>{r.role} · {r.time}</small></div>{r.accepted&&<span className="acceptedChip">✓ Accepted Answer</span>}</div><p>{r.body}</p><div className="replyActions"><button onClick={()=>likeReply(r.id)}>👍 {r.likes}</button><button onClick={()=>focusReply(r.id)}>💬 {r.comments.length}</button><button onClick={()=>focusReply(r.id)}>↩ Reply</button>{selectedPost.type==="QUESTION"&&!r.accepted&&["TENANT_ADMIN","FACULTY","TRAINER","COORDINATOR"].includes(role)&&<button onClick={()=>markAccepted(r.id)}>✓ Accept Answer</button>}<button onClick={()=>setReportTarget({kind:"REPLY",id:r.id,title:`Reply by ${r.author}`})}>⚑ Report</button></div>{r.comments.map(c=><div className="nestedComment" key={c.id}><span className="avatar tiny">{c.author.split(" ").map(x=>x[0]).join("").slice(0,2)}</span><div><b>{c.author}</b><p>{c.body}</p><small>{c.time}</small></div></div>)}</article>)}</div><div className="replyComposer"><span className="avatar">CU</span><div>{replyingToId&&<div className="replyingToBanner"><span>Replying to this conversation</span><button type="button" onClick={()=>setReplyingToId(null)}>×</button></div>}<textarea ref={replyTextareaRef} value={replyText} onChange={e=>setReplyText(e.target.value)} placeholder={replyingToId?"Write your reply to this conversation...":"Write your reply..."}/>{replyAttachmentName&&<div className="replyAttachmentChip"><span>📎 {replyAttachmentName}</span><button type="button" onClick={()=>{setReplyAttachmentName("");if(replyAttachmentInputRef.current)replyAttachmentInputRef.current.value="";}}>×</button></div>}{showReplyEmojiPicker&&<div className="replyEmojiPicker">{[
  "😀","🙂","😊","😂","😍",
  "👍","👎","👏","🙌","🙏","🤝",
  "💡","✅","❓","❗","⚠️","📌",
  "📝","📚","📖","💻","🖥️","⌨️",
  "🔗","📎","📁","📄","📊","📈",
  "🎯","🚀","🧠","🔍","🛠️","⚙️",
  "💬","🗣️","👥","👤","📣","🔔",
  "⏰","📅","🏆","⭐","🎉","💯"
].map(emoji=><button type="button" key={emoji} onClick={()=>{insertReplyText(emoji);setShowReplyEmojiPicker(false);}}>{emoji}</button>)}</div>}<div className="composerBottom"><div><button type="button" title="Emoji" onClick={()=>setShowReplyEmojiPicker(v=>!v)}>☺</button><button type="button" title="Attach file" onClick={()=>replyAttachmentInputRef.current?.click()}>📎</button><button type="button" title="Code" onClick={insertReplyCode}>&lt;/&gt;</button><button type="button" title="Mention" onClick={()=>insertReplyText("@")}>@</button><input ref={replyAttachmentInputRef} className="replyAttachmentInput" type="file" onChange={handleReplyAttachment}/></div><button className="primaryButton" onClick={addReply}>{replyingToId?"Post Reply":"Post Reply"}</button></div></div></div></section>}
    </section>}

    {screen==="NOTIFICATIONS"&&<section className="notificationsPage"><button className="backButton" onClick={()=>setScreen("HOME")}><img src={UI_ICON_SRC.back} alt="" />Back to Discussions</button><div className="notificationHeader"><div><p className="eyebrow">Activity</p><h1>Notifications</h1></div><button className="softButton" onClick={()=>setNotifications(items=>items.map(n=>({...n,read:true})))}>Mark all as read</button></div><div className="notificationTabs"><button className={notificationFilter==="ALL"?"active":""} onClick={()=>setNotificationFilter("ALL")}>All</button><button className={notificationFilter==="UNREAD"?"active":""} onClick={()=>setNotificationFilter("UNREAD")}>Unread ({unreadCount})</button><button className={notificationFilter==="MENTIONS"?"active":""} onClick={()=>setNotificationFilter("MENTIONS")}>Mentions</button><button className={notificationFilter==="REPLIES"?"active":""} onClick={()=>setNotificationFilter("REPLIES")}>Replies</button></div><div className="notificationList">{visibleNotifications.map(n=><button key={n.id} className={`notificationItem ${!n.read?"unread":""}`} onClick={()=>{setNotifications(items=>items.map(x=>x.id===n.id?{...x,read:true}:x));if(n.postId)openDetail(n.postId);}}><span className={`notificationDot ${n.type.toLowerCase()}`}/><div><b>{n.title}</b><p>{n.message}</p><small>{n.time}</small></div>{!n.read&&<i/>}</button>)}</div></section>}

    {createOpen&&draft.type&&<div className="modalBackdrop"><section className="createModal singleCreateModal">
      <header className="modalHeader">
        <div>
          <p className="eyebrow createPostLabel">Create {POST_LABELS[draft.type].label}</p>
          <h2>{draft.type==="QUESTION"?"Ask your question":draft.type==="DISCUSSION"?"Start your discussion":draft.type==="POLL"?"Create your poll":"Share your resource"}</h2>
        </div>
        <button onClick={closeCreate} aria-label="Close create post"><X aria-hidden="true" /></button>
      </header>

      <div className="modalBody singleCreateBody">
        <div className="formStack">
          <section className="createFormSection">
            <div className="createSectionHeading">
              <b>Content</b>
              <small>Add the details for your {POST_LABELS[draft.type].label.toLowerCase()}.</small>
            </div>

            {draft.type==="POLL"?<>
              <label>Poll question *
                <input value={draft.pollQuestion} onChange={e=>setDraft(d=>({...d,pollQuestion:e.target.value}))} placeholder="Which technology should we practice next?"/>
              </label>

              <div className="pollOptionsEditor">
                <span className="fieldLabel">Options *</span>
                {draft.pollOptions.map((o,i)=><div key={i}>
                  <input value={o} onChange={e=>{const next=[...draft.pollOptions];next[i]=e.target.value;setDraft(d=>({...d,pollOptions:next}));}} placeholder={`Option ${i+1}`}/>
                  <button type="button" disabled={draft.pollOptions.length<=2} onClick={()=>setDraft(d=>({...d,pollOptions:d.pollOptions.filter((_,idx)=>idx!==i)}))}><X aria-hidden="true" /></button>
                </div>)}
                <button type="button" className="softButton fit" onClick={()=>setDraft(d=>({...d,pollOptions:[...d.pollOptions,""]}))}><Plus aria-hidden="true" />Add Option</button>
              </div>

              <div className="toggleStack">
                <label className="toggleRow">
                  <span><b>Multiple choice</b><small>Allow more than one option</small></span>
                  <span className={`discussionCheck ${draft.pollMultiple?"checked":""}`} aria-hidden="true">{draft.pollMultiple&&<Check size={10} strokeWidth={2.2}/>}</span>
                  <input className="discussionCheckInput" type="checkbox" checked={draft.pollMultiple} onChange={e=>setDraft(d=>({...d,pollMultiple:e.target.checked}))}/>
                </label>
                <label className="toggleRow">
                  <span><b>Show results after vote</b><small>Hide results until user votes</small></span>
                  <span className={`discussionCheck ${draft.pollShowResults?"checked":""}`} aria-hidden="true">{draft.pollShowResults&&<Check size={10} strokeWidth={2.2}/>}</span>
                  <input className="discussionCheckInput" type="checkbox" checked={draft.pollShowResults} onChange={e=>setDraft(d=>({...d,pollShowResults:e.target.checked}))}/>
                </label>
                <label className="toggleRow">
                  <span><b>Allow comments</b><small>Allow discussion below poll</small></span>
                  <span className={`discussionCheck ${draft.pollAllowComments?"checked":""}`} aria-hidden="true">{draft.pollAllowComments&&<Check size={10} strokeWidth={2.2}/>}</span>
                  <input className="discussionCheckInput" type="checkbox" checked={draft.pollAllowComments} onChange={e=>setDraft(d=>({...d,pollAllowComments:e.target.checked}))}/>
                </label>
              </div>

              <label>Tags
                <input value={draft.tags} onChange={e=>setDraft(d=>({...d,tags:e.target.value}))} placeholder="Poll, Practice, Community"/>
              </label>

              <label className="singleUploadLabel">Attachment
                <span className="uploadButton"><Paperclip aria-hidden="true" />{draft.attachmentName||"Add file (optional)"}<input type="file" onChange={handleFile}/></span>
              </label>
            </>:<>
              <label>Title *
                <input value={draft.title} onChange={e=>setDraft(d=>({...d,title:e.target.value}))} placeholder={draft.type==="QUESTION"?"What would you like help with?":draft.type==="RESOURCE"?"Resource title":"Discussion title"}/>
              </label>

              <label>Description *
                <div className="editorBox">
                  <div className="editorToolbar editorToolbarRestored">

                    <button type="button" title="Bold" aria-label="Bold" onMouseDown={(e) => editorButtonMouseDown(e, "bold")}><Bold aria-hidden="true" /></button>
                    <button type="button" title="Italic" aria-label="Italic" onMouseDown={(e) => editorButtonMouseDown(e, "italic")}><Italic aria-hidden="true" /></button>
                    <button type="button" title="Underline" aria-label="Underline" onMouseDown={(e) => editorButtonMouseDown(e, "underline")}><Underline aria-hidden="true" /></button>
                    <button type="button" title="Numbered list" aria-label="Numbered list" onMouseDown={(e) => editorButtonMouseDown(e, "numbered")}><ListOrdered aria-hidden="true" /></button>
                    <button type="button" title="Bullet list" aria-label="Bullet list" onMouseDown={(e) => editorButtonMouseDown(e, "bullet")}><List aria-hidden="true" /></button>
                    <button type="button" title="Quote" aria-label="Quote" onMouseDown={(e) => editorButtonMouseDown(e, "quote")}><Quote aria-hidden="true" /></button>
                    <button type="button" title="Attach file" aria-label="Attach file" onMouseDown={(e) => editorButtonMouseDown(e, "attachment")}><Paperclip aria-hidden="true" /></button>
                    <button type="button" title="Insert web link" aria-label="Insert web link" onMouseDown={(e) => editorButtonMouseDown(e, "link")}><Link2 aria-hidden="true" /></button>
                    <button type="button" title="Code block" aria-label="Code block" onMouseDown={(e) => editorButtonMouseDown(e, "code")}><Code2 aria-hidden="true" /></button>
                    <button type="button" title="Mention" aria-label="Mention" onMouseDown={(e) => editorButtonMouseDown(e, "mention")}><AtSign aria-hidden="true" /></button>
                    <button type="button" title="Emoji" aria-label="Emoji" onMouseDown={(e) => editorButtonMouseDown(e, "emoji")}><Smile aria-hidden="true" /></button>
                  </div>

                  {showEmojiPicker&&<div className="emojiPicker" onMouseDown={(e)=>e.preventDefault()}>
                    {[
  "😀","🙂","😊","😂","😍",
  "👍","👎","👏","🙌","🙏","🤝",
  "💡","✅","❓","❗","⚠️","📌",
  "📝","📚","📖","💻","🖥️","⌨️",
  "🔗","📎","📁","📄","📊","📈",
  "🎯","🚀","🧠","🔍","🛠️","⚙️",
  "💬","🗣️","👥","👤","📣","🔔",
  "⏰","📅","🏆","⭐","🎉","💯"
].map(emoji=><button key={emoji} type="button" aria-label={`Insert ${emoji}`} onClick={()=>insertEmoji(emoji)}>{emoji}</button>)}
                  </div>}

                  <div ref={descriptionRef} className="richTextEditor" contentEditable suppressContentEditableWarning data-placeholder="Write the details here..." onInput={syncDescriptionFromEditor} onKeyDown={handleEditorKeyDown} onKeyUp={saveEditorSelection} onMouseUp={saveEditorSelection} onFocus={saveEditorSelection}/>
                  <input ref={attachmentInputRef} className="editorAttachmentInput" type="file" accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.ppt,.pptx,.txt,.zip" onChange={handleFile}/>
                  {draft.attachmentName&&<div className="editorAttachmentPreview">
                    <Paperclip aria-hidden="true" />
                    <b>{draft.attachmentName}</b>
                    <button type="button" aria-label="Remove attachment" onClick={()=>{setDraft(d=>({...d,attachmentName:""}));if(attachmentInputRef.current)attachmentInputRef.current.value="";}}><X aria-hidden="true" /></button>
                  </div>}
                </div>
              </label>

              {draft.type==="RESOURCE"&&<label>Resource link
                <input value={draft.resourceUrl} onChange={e=>setDraft(d=>({...d,resourceUrl:e.target.value}))} placeholder="https://..."/>
              </label>}

              <label>Tags
                <input value={draft.tags} onChange={e=>setDraft(d=>({...d,tags:e.target.value}))} placeholder="BigQuery, GCP, DataEngineering"/>
              </label>

              <label className="singleUploadLabel">Attachment
                <span className="uploadButton">
                  <Paperclip aria-hidden="true" />
                  {draft.attachmentName||"Add file (optional)"}
                  <input type="file" onChange={handleFile}/>
                </span>
              </label>
            </>}
          </section>

          <section className="createFormSection">
            <div className="createSectionHeading">
              <b>Community & audience</b>
              <small>Choose where this post should be visible.</small>
            </div>

            <label>Community *
              <div className={`singleCreateDropdown ${createDropdownOpen==="COMMUNITY"?"open":""}`}>
                <button type="button" className="singleCreateDropdownTrigger" onClick={()=>setCreateDropdownOpen(v=>v==="COMMUNITY"?null:"COMMUNITY")}>
                  <span>{draft.communityId?communities.find(c=>c.id===draft.communityId)?.name:"Select community"}</span>
                  <ChevronDown aria-hidden="true" />
                </button>
                {createDropdownOpen==="COMMUNITY"&&<div className="singleCreateDropdownMenu">
                  {communities.map(c=><button type="button" key={c.id} onClick={()=>{setDraft(d=>({...d,communityId:c.id,scopeId:""}));setCreateDropdownOpen(null);}}>
                    <span className={`discussionCheck ${draft.communityId===c.id?"checked":""}`} aria-hidden="true">{draft.communityId===c.id&&<Check size={10} strokeWidth={2.2}/>}</span>
                    <span>{c.name}</span>
                  </button>)}
                </div>}
              </div>
            </label>

            <label>Target Audience *
              <div className={`singleCreateDropdown ${!draft.communityId?"disabled":""} ${createDropdownOpen==="AUDIENCE"?"open":""}`}>
                <button type="button" className="singleCreateDropdownTrigger" disabled={!draft.communityId} onClick={()=>setCreateDropdownOpen(v=>v==="AUDIENCE"?null:"AUDIENCE")}>
                  <span>{draft.scopeId?availableScopes.find(s=>s.id===draft.scopeId)?.label:"Select audience"}</span>
                  <ChevronDown aria-hidden="true" />
                </button>
                {createDropdownOpen==="AUDIENCE"&&draft.communityId&&<div className="singleCreateDropdownMenu">
                  {availableScopes.map(s=><button type="button" key={s.id} onClick={()=>{setDraft(d=>({...d,scopeId:s.id}));setCreateDropdownOpen(null);}}>
                    <span className={`discussionCheck ${draft.scopeId===s.id?"checked":""}`} aria-hidden="true">{draft.scopeId===s.id&&<Check size={10} strokeWidth={2.2}/>}</span>
                    <span><b>{s.label}</b><small>{s.type}</small></span>
                  </button>)}
                </div>}
              </div>
            </label>
          </section>
        </div>
      </div>

      <footer className="modalFooter singleCreateFooter">
        <button className="softButton" onClick={()=>{setCreateOpen(false);setCreateDropdownOpen(null);setCreateMenuOpen(true);}}>Back</button>
        <button className="primaryButton" onClick={publishPost}><Send aria-hidden="true" />Publish Post</button>
      </footer>
    </section></div>}

    {postSuccessOpen&&selectedPost&&<div className="modalBackdrop postSuccessBackdrop"><section className="postSuccessModal">
      <div className="postSuccessBadge">
        <CheckCircle2 aria-hidden="true" />
      </div>

      <p className="postSuccessEyebrow">Published successfully</p>
      <h2>Your {POST_LABELS[selectedPost.type].label.toLowerCase()} has been posted!</h2>
      <p className="postSuccessText">
        Your {POST_LABELS[selectedPost.type].label.toLowerCase()} is now live in <b>{selectedPost.communityName}</b>.
      </p>

      <div className="postSuccessActions">
        <button className="primaryButton" onClick={()=>{setPostSuccessOpen(false);setSelectedPostId(null);setScreen("HOME");}}>
          Back to Discussions
        </button>
        <button className="softButton" onClick={()=>{setPostSuccessOpen(false);setSelectedPostId(null);resetDraft();setScreen("HOME");setCreateMenuOpen(true);}}>
          Create Another Post
        </button>
      </div>
    </section></div>}

    {deleteConfirmPostId!==null&&<div className="modalBackdrop confirmBackdrop"><section className="confirmModal">
      <div className="confirmIcon danger">
        <Trash2 aria-hidden="true" />
      </div>
      <h2>Delete this post?</h2>
      <p>This action will remove the post from the discussion feed. You cannot undo this action.</p>
      <div className="confirmActions">
        <button className="softButton" onClick={()=>setDeleteConfirmPostId(null)}>Cancel</button>
        <button className="dangerConfirmButton" onClick={confirmDeletePost}>Delete Post</button>
      </div>
    </section></div>}

    {editPostOpen&&<div className="modalBackdrop"><section className="editPostModal">
      <header className="modalHeader">
        <div><p className="eyebrow">Edit post</p><h2>Update your published post</h2><small>Save the changes when you are finished.</small></div>
        <button onClick={()=>setEditPostOpen(false)}>×</button>
      </header>

      <div className="modalBody editPostForm">
        <label>Title *<input value={editPostTitle} onChange={e=>setEditPostTitle(e.target.value)} /></label>
        <label>Description<textarea value={editPostBody} onChange={e=>setEditPostBody(e.target.value)} /></label>
        <label>Tags<input value={editPostTags} onChange={e=>setEditPostTags(e.target.value)} placeholder="Tag1, Tag2, Tag3" /></label>
      </div>

      <footer className="modalFooter">
        <button className="softButton" onClick={()=>setEditPostOpen(false)}>Cancel</button>
        <button className="primaryButton" onClick={saveEditedPost}>Save Changes</button>
      </footer>
    </section></div>}

    {reportTarget&&<div className="modalBackdrop"><section className="reportModal"><header className="modalHeader"><div><p className="eyebrow">Safety & moderation</p><h2>Report {reportTarget.kind==="POST"?"Post":"Reply"}</h2><small>{reportTarget.title}</small></div><button onClick={()=>setReportTarget(null)}>×</button></header><div className="modalBody"><p className="reportQuestion">Why are you reporting this?</p><div className="reportReasons">{REPORT_REASONS.map(r=><label key={r}>
  <span className={`discussionCheck ${reportReason===r?"checked":""}`} aria-hidden="true">{reportReason===r&&<Check size={10} strokeWidth={2.2}/>}</span>
  <input className="discussionCheckInput" type="radio" checked={reportReason===r} onChange={()=>setReportReason(r)}/>
  <span>{r}</span>
</label>)}</div><label className="reportDetails">Additional details<textarea value={reportDetails} onChange={e=>setReportDetails(e.target.value)} placeholder="Please provide more information..."/></label></div><footer className="modalFooter"><button className="softButton" onClick={()=>setReportTarget(null)}>Cancel</button><button className="primaryButton" onClick={submitReport}>Submit Report</button></footer></section></div>}

    {toast&&<div className="toast">{toast}</div>}
  </main>;
}
