import { PrismaClient, UserRole, UserStatus, VesselStatus, PRCategory, PRPriority } from '@prisma/client'
import * as bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // ===========================================
  // Create Vessels
  // ===========================================
  console.log('📦 Creating vessels...')
  
  const vessels = await Promise.all([
    prisma.vessel.upsert({
      where: { imo: 'IMO9876543' },
      update: {},
      create: {
        name: 'MV Ocean Star',
        imo: 'IMO9876543',
        flag: 'France',
        type: 'Cargo',
        grossTonnage: 45000,
        status: VesselStatus.ACTIVE,
      },
    }),
    prisma.vessel.upsert({
      where: { imo: 'IMO9876544' },
      update: {},
      create: {
        name: 'MV Atlantic Wave',
        imo: 'IMO9876544',
        flag: 'France',
        type: 'Tanker',
        grossTonnage: 52000,
        status: VesselStatus.ACTIVE,
      },
    }),
    prisma.vessel.upsert({
      where: { imo: 'IMO9876545' },
      update: {},
      create: {
        name: 'MV Pacific Dream',
        imo: 'IMO9876545',
        flag: 'France',
        type: 'Container',
        grossTonnage: 68000,
        status: VesselStatus.ACTIVE,
      },
    }),
  ])

  console.log(`✅ Created ${vessels.length} vessels`)

  // ===========================================
  // Create Users with hashed passwords
  // ===========================================
  console.log('👥 Creating users...')
  
  const defaultPassword = await bcrypt.hash('password123', 12)

  const users = await Promise.all([
    // Admin
    prisma.user.upsert({
      where: { email: 'admin@vesselms.com' },
      update: {},
      create: {
        email: 'admin@vesselms.com',
        password: defaultPassword,
        name: 'Administrateur Système',
        role: UserRole.ADMIN,
        status: UserStatus.ACTIVE,
      },
    }),
    // CSO
    prisma.user.upsert({
      where: { email: 'cso@vesselms.com' },
      update: {},
      create: {
        email: 'cso@vesselms.com',
        password: defaultPassword,
        name: 'Jean-Pierre Martin',
        role: UserRole.CSO,
        status: UserStatus.ACTIVE,
        phone: '+33 6 12 34 56 78',
      },
    }),
    // Capitaine - Vessel 1
    prisma.user.upsert({
      where: { email: 'capitaine.oceanstar@vesselms.com' },
      update: {},
      create: {
        email: 'capitaine.oceanstar@vesselms.com',
        password: defaultPassword,
        name: 'Jean Dupont',
        role: UserRole.CAPITAINE,
        status: UserStatus.ACTIVE,
        vesselId: vessels[0].id,
        phone: '+33 6 23 45 67 89',
      },
    }),
    // Chef Mécanicien - Vessel 1
    prisma.user.upsert({
      where: { email: 'mecano.oceanstar@vesselms.com' },
      update: {},
      create: {
        email: 'mecano.oceanstar@vesselms.com',
        password: defaultPassword,
        name: 'Pierre Martin',
        role: UserRole.CHEF_MECANICIEN,
        status: UserStatus.ACTIVE,
        vesselId: vessels[0].id,
        phone: '+33 6 34 56 78 90',
      },
    }),
    // Capitaine - Vessel 2
    prisma.user.upsert({
      where: { email: 'capitaine.atlantic@vesselms.com' },
      update: {},
      create: {
        email: 'capitaine.atlantic@vesselms.com',
        password: defaultPassword,
        name: 'Marie Lambert',
        role: UserRole.CAPITAINE,
        status: UserStatus.ACTIVE,
        vesselId: vessels[1].id,
      },
    }),
    // Chef Mécanicien - Vessel 2
    prisma.user.upsert({
      where: { email: 'mecano.atlantic@vesselms.com' },
      update: {},
      create: {
        email: 'mecano.atlantic@vesselms.com',
        password: defaultPassword,
        name: 'Paul Bernard',
        role: UserRole.CHEF_MECANICIEN,
        status: UserStatus.ACTIVE,
        vesselId: vessels[1].id,
      },
    }),
    // Capitaine - Vessel 3
    prisma.user.upsert({
      where: { email: 'capitaine.pacific@vesselms.com' },
      update: {},
      create: {
        email: 'capitaine.pacific@vesselms.com',
        password: defaultPassword,
        name: 'Sophie Moreau',
        role: UserRole.CAPITAINE,
        status: UserStatus.ACTIVE,
        vesselId: vessels[2].id,
      },
    }),
    // Chef Mécanicien - Vessel 3
    prisma.user.upsert({
      where: { email: 'mecano.pacific@vesselms.com' },
      update: {},
      create: {
        email: 'mecano.pacific@vesselms.com',
        password: defaultPassword,
        name: 'Lucas Girard',
        role: UserRole.CHEF_MECANICIEN,
        status: UserStatus.ACTIVE,
        vesselId: vessels[2].id,
      },
    }),
  ])

  console.log(`✅ Created ${users.length} users`)

  // ===========================================
  // Create Roles
  // ===========================================
  console.log('🔐 Creating roles...')
  
  const roles = await Promise.all([
    prisma.role.upsert({
      where: { name: 'Administrateur' },
      update: {},
      create: {
        name: 'Administrateur',
        description: 'Accès complet à toutes les fonctionnalités du système',
      },
    }),
    prisma.role.upsert({
      where: { name: 'CSO' },
      update: {},
      create: {
        name: 'CSO',
        description: 'Company Security Officer - Gestion de la sécurité maritime',
      },
    }),
    prisma.role.upsert({
      where: { name: 'DPA' },
      update: {},
      create: {
        name: 'DPA',
        description: 'Designated Person Ashore - Responsable désigné à terre',
      },
    }),
    prisma.role.upsert({
      where: { name: 'OPS' },
      update: {},
      create: {
        name: 'OPS',
        description: 'Opérations - Gestion des opérations maritimes',
      },
    }),
    prisma.role.upsert({
      where: { name: 'Finance' },
      update: {},
      create: {
        name: 'Finance',
        description: 'Service financier - Gestion des finances',
      },
    }),
    prisma.role.upsert({
      where: { name: 'Comptabilité' },
      update: {},
      create: {
        name: 'Comptabilité',
        description: 'Service comptabilité',
      },
    }),
    prisma.role.upsert({
      where: { name: 'Direction Technique' },
      update: {},
      create: {
        name: 'Direction Technique',
        description: 'Direction technique - Supervision technique de la flotte',
      },
    }),
    prisma.role.upsert({
      where: { name: 'Direction Générale' },
      update: {},
      create: {
        name: 'Direction Générale',
        description: 'Direction générale - Supervision globale',
      },
    }),
    prisma.role.upsert({
      where: { name: 'Capitaine (Master)' },
      update: {},
      create: {
        name: 'Capitaine (Master)',
        description: 'Capitaine de navire - Gestion des demandes d\'achat et équipage',
      },
    }),
    prisma.role.upsert({
      where: { name: 'Chief Mate' },
      update: {},
      create: {
        name: 'Chief Mate',
        description: 'Second capitaine - Gestion pont et cargaison',
      },
    }),
    prisma.role.upsert({
      where: { name: 'Chef Mécanicien' },
      update: {},
      create: {
        name: 'Chef Mécanicien',
        description: 'Chef mécanicien - Maintenance et demandes d\'achat',
      },
    }),
    prisma.role.upsert({
      where: { name: 'Second' },
      update: {},
      create: {
        name: 'Second',
        description: 'Second officier - Support opérationnel',
      },
    }),
    prisma.role.upsert({
      where: { name: 'Yotna' },
      update: {},
      create: {
        name: 'Yotna',
        description: 'Yotna - Équipage navire',
      },
    }),
    prisma.role.upsert({
      where: { name: 'Commercial' },
      update: {},
      create: {
        name: 'Commercial',
        description: 'Service commercial',
      },
    }),
  ])

  console.log(`✅ Created ${roles.length} roles`)

  // ===========================================
  // Create Permissions
  // ===========================================
  console.log('🔑 Creating permissions...')
  
  const modules = ['vessels', 'users', 'roles', 'documents', 'purchase_requests']
  const actions = ['create', 'read', 'update', 'delete']
  
  const permissions = []
  for (const module of modules) {
    for (const action of actions) {
      const permission = await prisma.permission.upsert({
        where: { name: `${module}.${action}` },
        update: {},
        create: {
          name: `${module}.${action}`,
          description: `${action.charAt(0).toUpperCase() + action.slice(1)} ${module}`,
          module,
          action,
        },
      })
      permissions.push(permission)
    }
  }

  console.log(`✅ Created ${permissions.length} permissions`)

  // ===========================================
  // Create Sample Purchase Requests
  // ===========================================
  console.log('📋 Creating sample purchase requests...')
  
  const capitaine1 = users.find(u => u.email === 'capitaine.oceanstar@vesselms.com')!
  const mecano1 = users.find(u => u.email === 'mecano.oceanstar@vesselms.com')!

  // Delete existing purchase requests first to avoid duplicate errors
  await prisma.pRProduct.deleteMany({})
  await prisma.purchaseRequest.deleteMany({})

  const purchaseRequests = await Promise.all([
    prisma.purchaseRequest.create({
      data: {
        reference: 'PR-2024-001',
        category: PRCategory.SPARE_PARTS,
        masterApproved: true,
        priority: PRPriority.MEDIUM,
        notes: 'Remplacement préventif des filtres',
        createdById: capitaine1.id,
        vesselId: vessels[0].id,
        products: {
          create: [
            { name: 'Filtre à huile', quantity: 5, unit: 'pcs' },
            { name: 'Courroie de distribution', quantity: 2, unit: 'pcs' },
          ],
        },
      },
    }),
    prisma.purchaseRequest.create({
      data: {
        reference: 'PR-2024-002',
        category: PRCategory.LUBRICANTS,
        masterApproved: true,
        priority: PRPriority.HIGH,
        createdById: mecano1.id,
        vesselId: vessels[0].id,
        products: {
          create: [
            { name: 'Huile moteur 15W40', quantity: 200, unit: 'L' },
          ],
        },
      },
    }),
    prisma.purchaseRequest.create({
      data: {
        reference: 'PR-2024-003',
        category: PRCategory.SAFETY_EQUIPMENT,
        masterApproved: false,
        priority: PRPriority.URGENT,
        createdById: capitaine1.id,
        vesselId: vessels[0].id,
        products: {
          create: [
            { name: 'Gilets de sauvetage', quantity: 10, unit: 'pcs' },
            { name: 'Extincteurs CO2', quantity: 4, unit: 'pcs' },
          ],
        },
      },
    }),
  ])

  console.log(`✅ Created ${purchaseRequests.length} purchase requests`)

  // ===========================================
  // Create Document Folders
  // ===========================================
  console.log('📁 Creating document folders...')
  
  const csoUser = users.find(u => u.role === UserRole.CSO)!

  // Delete existing folders first to avoid duplicate errors
  await prisma.document.deleteMany({})
  await prisma.documentFolder.deleteMany({})
  
  const folders = await Promise.all([
    prisma.documentFolder.create({
      data: {
        name: 'Certifications ISPS',
        color: '#3b82f6',
        createdById: csoUser.id,
      },
    }),
    prisma.documentFolder.create({
      data: {
        name: 'Plans de sécurité',
        color: '#10b981',
        createdById: csoUser.id,
      },
    }),
    prisma.documentFolder.create({
      data: {
        name: 'Rapports d\'audit',
        color: '#f59e0b',
        createdById: csoUser.id,
      },
    }),
    prisma.documentFolder.create({
      data: {
        name: 'Formations équipage',
        color: '#8b5cf6',
        createdById: csoUser.id,
      },
    }),
  ])

  console.log(`✅ Created ${folders.length} document folders`)

  console.log('')
  console.log('🎉 Database seeding completed!')
  console.log('')
  console.log('📝 Default credentials:')
  console.log('   Email: admin@vesselms.com')
  console.log('   Password: password123')
  console.log('')
  console.log('   Email: cso@vesselms.com')
  console.log('   Password: password123')
  console.log('')
  console.log('   Email: capitaine.oceanstar@vesselms.com')
  console.log('   Password: password123')
  console.log('')
  console.log('   Email: mecano.oceanstar@vesselms.com')
  console.log('   Password: password123')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
