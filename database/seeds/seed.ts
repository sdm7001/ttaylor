/**
 * Prisma seed script for the Ttaylor Family Law platform.
 *
 * Seeds:
 * 1. Roles (Attorney, Paralegal, Legal Assistant, Receptionist, Admin)
 * 2. Permissions (all RBAC permission constants)
 * 3. Role-permission associations
 * 4. Matter types (Texas family law case types)
 * 5. One demo admin user
 *
 * Run with: npx ts-node database/seeds/seed.ts
 * Or via:   npx prisma db seed
 */
import { PrismaClient, RoleLevel } from '@prisma/client';
import { ALL_PERMISSIONS, ROLE_PERMISSIONS, type Permission } from '@ttaylor/auth';

const prisma = new PrismaClient();

// ---------------------------------------------------------------------------
// Role definitions
// ---------------------------------------------------------------------------

interface RoleDef {
  name: string;
  level: RoleLevel;
  description: string;
}

const ROLES: RoleDef[] = [
  {
    name: 'Attorney',
    level: RoleLevel.ATTORNEY,
    description: 'Licensed attorney with full matter access and approval authority',
  },
  {
    name: 'Paralegal',
    level: RoleLevel.PARALEGAL,
    description: 'Paralegal with document generation, intake, and filing capabilities',
  },
  {
    name: 'Legal Assistant',
    level: RoleLevel.LEGAL_ASSISTANT,
    description: 'Legal assistant with limited document and intake capabilities',
  },
  {
    name: 'Receptionist',
    level: RoleLevel.RECEPTIONIST,
    description: 'Front desk staff handling intake and scheduling',
  },
  {
    name: 'Admin',
    level: RoleLevel.ADMIN,
    description: 'System administrator with user management and audit access',
  },
];

// ---------------------------------------------------------------------------
// Matter type definitions
// ---------------------------------------------------------------------------

interface MatterTypeDef {
  code: string;
  name: string;
  category: string;
}

const MATTER_TYPES: MatterTypeDef[] = [
  { code: 'DIVORCE_UNCONTESTED', name: 'Divorce (Uncontested)', category: 'Divorce' },
  { code: 'DIVORCE_CONTESTED', name: 'Divorce (Contested)', category: 'Divorce' },
  { code: 'SAPCR', name: 'SAPCR', category: 'Child Custody' },
  { code: 'CHILD_SUPPORT', name: 'Child Support', category: 'Child Support' },
  { code: 'MODIFICATION', name: 'Modification', category: 'Post-Decree' },
  { code: 'ADOPTION', name: 'Adoption', category: 'Adoption' },
  { code: 'GRANDPARENTS_RIGHTS', name: 'Grandparents Rights', category: 'Family' },
  { code: 'MEDIATION', name: 'Mediation', category: 'ADR' },
  { code: 'POST_ORDER_ENFORCEMENT', name: 'Post-Order Enforcement', category: 'Post-Decree' },
];

// ---------------------------------------------------------------------------
// Seed function
// ---------------------------------------------------------------------------

async function seed() {
  console.log('Seeding Ttaylor database...\n');

  // 1. Create permissions
  console.log('Creating permissions...');
  const permissionRecords: Map<string, string> = new Map();

  for (const code of ALL_PERMISSIONS) {
    const permission = await prisma.permission.upsert({
      where: { code },
      update: {},
      create: {
        code,
        description: code.replace(/\./g, ' ').replace(/([A-Z])/g, ' $1').trim(),
      },
    });
    permissionRecords.set(code, permission.id);
  }
  console.log(`  Created ${permissionRecords.size} permissions`);

  // 2. Create roles
  console.log('Creating roles...');
  const roleRecords: Map<RoleLevel, string> = new Map();

  for (const roleDef of ROLES) {
    const role = await prisma.role.upsert({
      where: { name: roleDef.name },
      update: { level: roleDef.level, description: roleDef.description },
      create: {
        name: roleDef.name,
        level: roleDef.level,
        description: roleDef.description,
      },
    });
    roleRecords.set(roleDef.level, role.id);
  }
  console.log(`  Created ${roleRecords.size} roles`);

  // 3. Create role-permission associations
  console.log('Creating role-permission associations...');
  let associationCount = 0;

  for (const [roleLevel, permissions] of Object.entries(ROLE_PERMISSIONS)) {
    const roleId = roleRecords.get(roleLevel as RoleLevel);
    if (!roleId) continue;

    for (const permCode of permissions as Permission[]) {
      const permId = permissionRecords.get(permCode);
      if (!permId) continue;

      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: { roleId, permissionId: permId },
        },
        update: {},
        create: {
          roleId,
          permissionId: permId,
        },
      });
      associationCount++;
    }
  }
  console.log(`  Created ${associationCount} role-permission associations`);

  // 4. Create matter types
  console.log('Creating matter types...');
  for (const mt of MATTER_TYPES) {
    await prisma.matterType.upsert({
      where: { code: mt.code },
      update: { name: mt.name, category: mt.category },
      create: {
        code: mt.code,
        name: mt.name,
        category: mt.category,
      },
    });
  }
  console.log(`  Created ${MATTER_TYPES.length} matter types`);

  // 5. Create demo admin user
  console.log('Creating demo admin user...');
  const adminRole = roleRecords.get(RoleLevel.ADMIN);

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@ttaylorlegal.com' },
    update: {},
    create: {
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@ttaylorlegal.com',
      status: 'ACTIVE',
    },
  });

  if (adminRole) {
    await prisma.userRole.upsert({
      where: {
        userId_roleId: { userId: adminUser.id, roleId: adminRole },
      },
      update: {},
      create: {
        userId: adminUser.id,
        roleId: adminRole,
      },
    });
  }
  console.log(`  Created admin user: ${adminUser.email}`);

  console.log('\nSeed complete.');
}

// ---------------------------------------------------------------------------
// Execute
// ---------------------------------------------------------------------------

seed()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('Seed failed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
