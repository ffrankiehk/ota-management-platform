import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

interface ReleaseAttributes {
  id: string;
  application_id: string;
  version: string;
  build_number: number;
  bundle_url: string;
  bundle_hash: string;
  bundle_size: number;
  full_bundle_url?: string | null;
  full_bundle_hash?: string | null;
  full_bundle_size?: number | null;
  bundle_type?: string | null;
  signature?: string | null;
  patch_from_version?: string | null;
  target_platform?: string | null;
  min_app_version?: string | null;
  release_notes?: string | null;
  rollout_percentage: number;
  is_mandatory: boolean;
  status: 'draft' | 'active' | 'paused' | 'archived';
  released_at?: Date | null;
  created_by?: string | null;
  created_at?: Date;
  updated_at?: Date;
}

interface ReleaseCreationAttributes
  extends Optional<
    ReleaseAttributes,
    | 'id'
    | 'bundle_type'
    | 'signature'
    | 'patch_from_version'
    | 'target_platform'
    | 'min_app_version'
    | 'release_notes'
    | 'rollout_percentage'
    | 'is_mandatory'
    | 'status'
    | 'released_at'
    | 'created_by'
    | 'created_at'
    | 'updated_at'
  > {}

export class Release
  extends Model<ReleaseAttributes, ReleaseCreationAttributes>
  implements ReleaseAttributes
{
  public id!: string;
  public application_id!: string;
  public version!: string;
  public build_number!: number;
  public bundle_url!: string;
  public bundle_hash!: string;
  public bundle_size!: number;
  public full_bundle_url!: string | null;
  public full_bundle_hash!: string | null;
  public full_bundle_size!: number | null;
  public bundle_type!: string | null;
  public signature!: string | null;
  public patch_from_version!: string | null;
  public target_platform!: string | null;
  public min_app_version!: string | null;
  public release_notes!: string | null;
  public rollout_percentage!: number;
  public is_mandatory!: boolean;
  public status!: 'draft' | 'active' | 'paused' | 'archived';
  public released_at!: Date | null;
  public created_by!: string | null;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

Release.init(
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
    version: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    build_number: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    bundle_url: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    bundle_hash: {
      type: DataTypes.STRING(64),
      allowNull: false,
    },
    bundle_size: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    full_bundle_url: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    full_bundle_hash: {
      type: DataTypes.STRING(64),
      allowNull: true,
    },
    full_bundle_size: {
      type: DataTypes.BIGINT,
      allowNull: true,
    },
    bundle_type: {
      type: DataTypes.STRING(20),
      allowNull: true,
      defaultValue: 'js-bundle',
    },
    signature: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    patch_from_version: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    target_platform: {
      type: DataTypes.STRING(20),
      allowNull: true,
      defaultValue: 'react-native',
    },
    min_app_version: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    release_notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    rollout_percentage: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    is_mandatory: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'draft',
    },
    released_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    created_by: {
      type: DataTypes.UUID,
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
    tableName: 'releases',
    modelName: 'Release',
    indexes: [
      {
        fields: ['application_id', 'version'],
      },
    ],
  }
);
