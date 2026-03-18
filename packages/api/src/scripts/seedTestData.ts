import { sequelize } from '../config/database';
import { Organization, Application, Release, User } from '../models';
import bcrypt from 'bcryptjs';

async function seed() {
  try {
    await sequelize.authenticate();

    // Ensure models are synced
    await sequelize.sync();

    // 1. Create or find Organization
    const [org] = await Organization.findOrCreate({
      where: { slug: 'default-org' },
      defaults: {
        name: 'Default Organization',
        slug: 'default-org',
        api_key: 'dev-api-key',
      },
    });

    // 2. Create or find Admin User
    const passwordHash = await bcrypt.hash('admin123', 10);
    const [user] = await User.findOrCreate({
      where: { email: 'admin@example.com' },
      defaults: {
        organization_id: org.id,
        email: 'admin@example.com',
        password_hash: passwordHash,
        role: 'admin',
        is_active: true,
      },
    });
    console.log('Admin User ID:', user.id);
    console.log('Admin Email: admin@example.com');
    console.log('Admin Password: admin123');

    // 3. Create or find Application
    const [app] = await Application.findOrCreate({
      where: {
        organization_id: org.id,
        bundle_id: 'com.yourcompany.mentaltherapy',
        platform: 'ios',
      },
      defaults: {
        organization_id: org.id,
        name: 'Mental Therapy App',
        bundle_id: 'com.yourcompany.mentaltherapy',
        platform: 'ios',
        current_version: '1.0.0',
        is_active: true,
      },
    });

    // 3. Create a Release
    const [release] = await Release.findOrCreate({
      where: {
        application_id: app.id,
        version: '1.1.0',
      },
      defaults: {
        application_id: app.id,
        version: '1.1.0',
        build_number: 2,
        bundle_url: 'http://localhost:3032/bundles/mental-therapy-ios-1.1.0.bundle',
        bundle_hash: 'dummyhash1234567890abcdef',
        bundle_size: 1234567,
        min_app_version: '1.0.0',
        release_notes: 'Test release seeded from seedTestData.ts',
        rollout_percentage: 100,
        is_mandatory: false,
        status: 'active',
        released_at: new Date(),
        created_by: org.id,
      },
    });

    console.log('✅ Seed completed.');
    console.log('Organization ID:', org.id);
    console.log('Application ID:', app.id);
    console.log('Release ID:', release.id);

    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  }
}

seed();
