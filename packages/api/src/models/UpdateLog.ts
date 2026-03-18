import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

interface UpdateLogAttributes {
  id: string;
  device_id: string;
  release_id: string;
  status: string;
  error_message?: string | null;
  download_time_ms?: number | null;
  install_time_ms?: number | null;
  device_info?: any | null;
  installed_at?: Date | null;
  created_at?: Date;
  updated_at?: Date;
}

interface UpdateLogCreationAttributes
  extends Optional<
    UpdateLogAttributes,
    'id' | 'error_message' | 'download_time_ms' | 'install_time_ms' | 'device_info' | 'installed_at' | 'created_at' | 'updated_at'
  > {}

export class UpdateLog
  extends Model<UpdateLogAttributes, UpdateLogCreationAttributes>
  implements UpdateLogAttributes
{
  public id!: string;
  public device_id!: string;
  public release_id!: string;
  public status!: string;
  public error_message!: string | null;
  public download_time_ms!: number | null;
  public install_time_ms!: number | null;
  public device_info!: any | null;
  public installed_at!: Date | null;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

UpdateLog.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    device_id: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    release_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    error_message: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    download_time_ms: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    install_time_ms: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    device_info: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    installed_at: {
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
    tableName: 'update_logs',
    modelName: 'UpdateLog',
  }
);
