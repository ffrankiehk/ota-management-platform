import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

interface ApplicationAttributes {
  id: string;
  organization_id: string;
  name: string;
  bundle_id: string;
  platform: 'ios' | 'android' | 'both';
  current_version?: string | null;
  is_active: boolean;
  created_at?: Date;
  updated_at?: Date;
}

interface ApplicationCreationAttributes
  extends Optional<
    ApplicationAttributes,
    'id' | 'current_version' | 'is_active' | 'created_at' | 'updated_at'
  > {}

export class Application
  extends Model<ApplicationAttributes, ApplicationCreationAttributes>
  implements ApplicationAttributes
{
  public id!: string;
  public organization_id!: string;
  public name!: string;
  public bundle_id!: string;
  public platform!: 'ios' | 'android' | 'both';
  public current_version!: string | null;
  public is_active!: boolean;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

Application.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    organization_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    bundle_id: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    platform: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    current_version: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
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
    tableName: 'applications',
    modelName: 'Application',
    indexes: [
      {
        unique: true,
        fields: ['organization_id', 'bundle_id', 'platform'],
      },
    ],
  }
);
