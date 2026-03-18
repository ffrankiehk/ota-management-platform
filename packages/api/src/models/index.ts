import { sequelize } from '../config/database';
import { Organization } from './Organization';
import { Application } from './Application';
import { Release } from './Release';
import { Device } from './Device';
import { UpdateLog } from './UpdateLog';
import { User } from './User';
import { RollbackRule } from './RollbackRule';

// Define associations
Organization.hasMany(Application, { foreignKey: 'organization_id', as: 'applications' });
Application.belongsTo(Organization, { foreignKey: 'organization_id', as: 'organization' });

Organization.hasMany(User, { foreignKey: 'organization_id', as: 'users' });
User.belongsTo(Organization, { foreignKey: 'organization_id', as: 'organization' });

Application.hasMany(Release, { foreignKey: 'application_id', as: 'releases' });
Release.belongsTo(Application, { foreignKey: 'application_id', as: 'application' });

Application.hasMany(Device, { foreignKey: 'application_id', as: 'devices' });
Device.belongsTo(Application, { foreignKey: 'application_id', as: 'application' });

// UpdateLog.device_id is a STRING field (device identifier), not a foreign key to Device table
// So we don't define Device-UpdateLog association here

Release.hasMany(UpdateLog, { foreignKey: 'release_id', as: 'updateLogs' });
UpdateLog.belongsTo(Release, { foreignKey: 'release_id', as: 'release' });

Release.hasMany(RollbackRule, { foreignKey: 'release_id', as: 'rollbackRules' });
RollbackRule.belongsTo(Release, { foreignKey: 'release_id', as: 'release' });

export {
  sequelize,
  Organization,
  Application,
  Release,
  Device,
  UpdateLog,
  User,
  RollbackRule,
};
