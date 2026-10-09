import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client.js';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL is not configured');
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: databaseUrl,
  }),
});

const communities = [
  // ============================================================
  // UNIVERSITY / COLLEGE
  // ============================================================
  {
    id: 'uni-general',
    tenantType: 'UNIVERSITY_COLLEGE',
    name: 'General',
    description: 'General university and college discussions',
    scopes: [
      {
        id: 'uni-all',
        label: 'Entire College / University',
        type: 'TENANT',
      },
      {
        id: 'uni-all-students',
        label: 'All Students',
        type: 'ROLE',
      },
      {
        id: 'uni-all-faculty',
        label: 'All Faculty',
        type: 'ROLE',
      },
      {
        id: 'uni-coordinators',
        label: 'Department Coordinators',
        type: 'ROLE',
      },
      {
        id: 'uni-engineering-department',
        label: 'Engineering Department',
        type: 'DEPARTMENT',
      },
      {
        id: 'uni-cse-department',
        label: 'Computer Science Department',
        type: 'DEPARTMENT',
      },
    ],
  },

  {
    id: 'data-engineering',
    tenantType: 'UNIVERSITY_COLLEGE',
    name: 'Data Engineering',
    description: 'Data Engineering related discussions',
    scopes: [
      {
        id: 'de-course',
        label: 'Google Cloud Data Engineering',
        type: 'COURSE',
      },
      {
        id: 'de-batch-2026-a',
        label: 'Batch 2026-A',
        type: 'BATCH',
      },
      {
        id: 'de-batch-2026-b',
        label: 'Batch 2026-B',
        type: 'BATCH',
      },
      {
        id: 'de-students',
        label: 'Data Engineering Students',
        type: 'ROLE',
      },
      {
        id: 'de-faculty',
        label: 'Data Engineering Faculty',
        type: 'ROLE',
      },
    ],
  },

  {
    id: 'computer-science',
    tenantType: 'UNIVERSITY_COLLEGE',
    name: 'Computer Science',
    description: 'Computer Science discussions',
    scopes: [
      {
        id: 'cse-department',
        label: 'Computer Science Department',
        type: 'DEPARTMENT',
      },
      {
        id: 'data-structures-course',
        label: 'Data Structures Course',
        type: 'COURSE',
      },
      {
        id: 'cse-2026-cohort',
        label: 'CSE 2026 Cohort',
        type: 'BATCH',
      },
      {
        id: 'cse-students',
        label: 'Computer Science Students',
        type: 'ROLE',
      },
      {
        id: 'cse-faculty',
        label: 'Computer Science Faculty',
        type: 'ROLE',
      },
    ],
  },

  {
    id: 'placement-preparation',
    tenantType: 'UNIVERSITY_COLLEGE',
    name: 'Placement Preparation',
    description: 'Placement and career preparation discussions',
    scopes: [
      {
        id: 'placement-all-eligible',
        label: 'All Eligible Students',
        type: 'GROUP',
      },
      {
        id: 'placement-2026-batch',
        label: '2026 Placement Batch',
        type: 'BATCH',
      },
      {
        id: 'placement-final-year',
        label: 'Final Year Students',
        type: 'GROUP',
      },
      {
        id: 'placement-coordinators',
        label: 'Placement Coordinators',
        type: 'ROLE',
      },
    ],
  },

  // ============================================================
  // SKILL ACADEMY
  // ============================================================
  {
    id: 'academy-community',
    tenantType: 'SKILL_ACADEMY',
    name: 'Academy Community',
    description: 'General Skill Academy discussions',
    scopes: [
      {
        id: 'academy-all',
        label: 'Entire Skill Academy',
        type: 'TENANT',
      },
      {
        id: 'academy-all-learners',
        label: 'All Learners',
        type: 'ROLE',
      },
      {
        id: 'academy-all-trainers',
        label: 'All Trainers',
        type: 'ROLE',
      },
      {
        id: 'academy-programme-coordinators',
        label: 'Programme Coordinators',
        type: 'ROLE',
      },
      {
        id: 'academy-fullstack-programme',
        label: 'Full Stack Programme',
        type: 'PROGRAMME',
      },
    ],
  },

  {
    id: 'full-stack-development',
    tenantType: 'SKILL_ACADEMY',
    name: 'Full Stack Development',
    description: 'Full Stack Development discussions',
    scopes: [
      {
        id: 'fs-cohort-01',
        label: 'Cohort FS-01',
        type: 'BATCH',
      },
      {
        id: 'fs-cohort-02',
        label: 'Cohort FS-02',
        type: 'BATCH',
      },
      {
        id: 'fs-react-group',
        label: 'React Practice Group',
        type: 'GROUP',
      },
      {
        id: 'fs-learners',
        label: 'Full Stack Learners',
        type: 'ROLE',
      },
      {
        id: 'fs-trainers',
        label: 'Full Stack Trainers',
        type: 'ROLE',
      },
    ],
  },

  {
    id: 'cloud-certification',
    tenantType: 'SKILL_ACADEMY',
    name: 'Cloud Certification',
    description: 'Cloud certification discussions',
    scopes: [
      {
        id: 'cloud-programme',
        label: 'Cloud Certification Programme',
        type: 'PROGRAMME',
      },
      {
        id: 'aws-cohort',
        label: 'AWS Cohort',
        type: 'BATCH',
      },
      {
        id: 'cloud-learners',
        label: 'Cloud Learners',
        type: 'ROLE',
      },
      {
        id: 'cloud-trainers',
        label: 'Cloud Trainers',
        type: 'ROLE',
      },
    ],
  },

  // ============================================================
  // CORPORATE
  // ============================================================
  {
    id: 'company-community',
    tenantType: 'CORPORATE',
    name: 'Company Community',
    description: 'General company discussions',
    scopes: [
      {
        id: 'company-all',
        label: 'Entire Organization',
        type: 'TENANT',
      },
      {
        id: 'company-all-employees',
        label: 'All Employees',
        type: 'ROLE',
      },
      {
        id: 'company-all-managers',
        label: 'All Managers',
        type: 'ROLE',
      },
      {
        id: 'company-ld-team',
        label: 'L&D Team',
        type: 'ROLE',
      },
      {
        id: 'company-engineering-unit',
        label: 'Engineering Business Unit',
        type: 'DEPARTMENT',
      },
    ],
  },

  {
    id: 'learning-development',
    tenantType: 'CORPORATE',
    name: 'Learning & Development',
    description: 'Learning and Development discussions',
    scopes: [
      {
        id: 'ld-leadership-programme',
        label: 'Leadership Programme',
        type: 'PROGRAMME',
      },
      {
        id: 'ld-new-joiners',
        label: 'New Joiners Cohort',
        type: 'GROUP',
      },
      {
        id: 'ld-managers',
        label: 'Managers',
        type: 'ROLE',
      },
      {
        id: 'ld-employees',
        label: 'Employees',
        type: 'ROLE',
      },
      {
        id: 'ld-trainers',
        label: 'Trainers / Facilitators',
        type: 'ROLE',
      },
    ],
  },

  {
    id: 'engineering-community',
    tenantType: 'CORPORATE',
    name: 'Engineering',
    description: 'Engineering team discussions',
    scopes: [
      {
        id: 'engineering-business-unit',
        label: 'Engineering Business Unit',
        type: 'DEPARTMENT',
      },
      {
        id: 'frontend-employees',
        label: 'Frontend Employees',
        type: 'GROUP',
      },
      {
        id: 'backend-employees',
        label: 'Backend Employees',
        type: 'GROUP',
      },
      {
        id: 'engineering-managers',
        label: 'Engineering Managers',
        type: 'ROLE',
      },
      {
        id: 'technical-leads',
        label: 'Technical Leads',
        type: 'ROLE',
      },
    ],
  },

  // ============================================================
  // NGO
  // ============================================================
  {
    id: 'ngo-organization-community',
    tenantType: 'NGO',
    name: 'Organization Community',
    description: 'General NGO discussions',
    scopes: [
      {
        id: 'ngo-all',
        label: 'Entire NGO',
        type: 'TENANT',
      },
      {
        id: 'ngo-all-volunteers',
        label: 'All Volunteers',
        type: 'ROLE',
      },
      {
        id: 'ngo-staff-members',
        label: 'Staff Members',
        type: 'ROLE',
      },
      {
        id: 'ngo-programme-coordinators',
        label: 'Programme Coordinators',
        type: 'ROLE',
      },
      {
        id: 'ngo-volunteer-group',
        label: 'Volunteer Group',
        type: 'GROUP',
      },
    ],
  },

  {
    id: 'ngo-skills-programme',
    tenantType: 'NGO',
    name: 'Skills Programme',
    description: 'Skills programme discussions',
    scopes: [
      {
        id: 'ngo-skills-programme-all',
        label: 'Skills Programme',
        type: 'PROGRAMME',
      },
      {
        id: 'ngo-field-cohort',
        label: 'Field Cohort',
        type: 'BATCH',
      },
      {
        id: 'ngo-programme-participants',
        label: 'Programme Participants',
        type: 'GROUP',
      },
      {
        id: 'ngo-field-trainers',
        label: 'Field Trainers',
        type: 'ROLE',
      },
      {
        id: 'ngo-project-team',
        label: 'Project Team',
        type: 'GROUP',
      },
    ],
  },

  // ============================================================
  // GOVERNMENT
  // ============================================================
  {
    id: 'government-department-community',
    tenantType: 'GOVERNMENT',
    name: 'Department Community',
    description: 'General government department discussions',
    scopes: [
      {
        id: 'government-all',
        label: 'Entire Department / Organization',
        type: 'TENANT',
      },
      {
        id: 'government-all-officers',
        label: 'All Officers',
        type: 'ROLE',
      },
      {
        id: 'government-department-heads',
        label: 'Department Heads',
        type: 'ROLE',
      },
      {
        id: 'government-training-coordinators',
        label: 'Training Coordinators',
        type: 'ROLE',
      },
      {
        id: 'government-digital-services',
        label: 'Digital Services Department',
        type: 'DEPARTMENT',
      },
    ],
  },

  {
    id: 'officer-training',
    tenantType: 'GOVERNMENT',
    name: 'Officer Training',
    description: 'Officer training discussions',
    scopes: [
      {
        id: 'officer-training-programme',
        label: 'Officer Training Programme',
        type: 'PROGRAMME',
      },
      {
        id: 'officer-cohort-2026',
        label: 'Officer Cohort 2026',
        type: 'BATCH',
      },
      {
        id: 'officers',
        label: 'Officers',
        type: 'ROLE',
      },
      {
        id: 'government-trainers',
        label: 'Trainers / Facilitators',
        type: 'ROLE',
      },
      {
        id: 'government-training-coordinators-scope',
        label: 'Training Coordinators',
        type: 'ROLE',
      },
    ],
  },
];

async function main() {
  for (const community of communities) {
    await prisma.discussionCommunity.upsert({
      where: {
        id: community.id,
      },

      update: {
        tenantType: community.tenantType,
        name: community.name,
        description: community.description,
        active: true,
      },

      create: {
        id: community.id,
        tenantType: community.tenantType,
        name: community.name,
        description: community.description,
        active: true,
      },
    });

    for (const scope of community.scopes) {
      await prisma.discussionScope.upsert({
        where: {
          id: scope.id,
        },

        update: {
          communityId: community.id,
          label: scope.label,
          type: scope.type,
          active: true,
        },

        create: {
          id: scope.id,
          communityId: community.id,
          label: scope.label,
          type: scope.type,
          active: true,
        },
      });
    }
  }

  console.log(
    'Discussion communities and target audiences seeded successfully',
  );
}

try {
  await main();
} catch (error) {
  console.error('Discussion seed failed:', error);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}