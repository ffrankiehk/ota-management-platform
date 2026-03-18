import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

interface DeviceAttributes {
  id: string;
  application_id: string;
  device_id: string;
  platform: 'ios' | 'android';
  app_version?: string | null;
  bundle_version?: string | null;
  last_check_at?: Date | null;
  last_update_at?: Date | null;
  created_at?: Date;
  updated_at?: Date;
}

interface DeviceCreationAttributes
  extends Optional<
    DeviceAttributes,
    | 'id'
    | 'app_version'
    | 'bundle_version'
    | 'last_check_at'
    | 'last_update_at'
    | 'created_at'
    | 'updated_at'
  > {}

export class Device
  extends Model<DeviceAttributes, DeviceCreationAttributes>
  implements DeviceAttributes
{
  public id!: string;
  public application_id!: string;
  public device_id!: string;
  public platform!: 'ios' | 'android';
  public app_version!: string | null;
  public bundle_version!: string | null;
  public last_check_at!: Date | null;
  public last_update_at!: Date | null;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

Device.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    application_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    device_id: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    platform: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    app_version: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    bundle_version: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    last_check_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    last_update_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: 'devices',
    modelName: 'Device',
    indexes: [
      {
        unique: true,
        fields: ['application_id', 'device_id'],
      },
    ],
  }
);
