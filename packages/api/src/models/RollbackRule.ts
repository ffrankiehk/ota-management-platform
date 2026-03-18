import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

interface RollbackRuleAttributes {
  id: string;
  release_id: string;
  failure_threshold: number;
  time_window_minutes: number;
  min_install_attempts: number;
  is_active: boolean;
  rollback_to_version?: string | null;
  created_at?: Date;
  updated_at?: Date;
}

interface RollbackRuleCreationAttributes
  extends Optional<
    RollbackRuleAttributes,
    'id' | 'rollback_to_version' | 'created_at' | 'updated_at'
  > {}

export class RollbackRule
  extends Model<RollbackRuleAttributes, RollbackRuleCreationAttributes>
  implements RollbackRuleAttributes
{
  public id!: string;
  public release_id!: string;
  public failure_threshold!: number;
  public time_window_minutes!: number;
  public min_install_attempts!: number;
  public is_active!: boolean;
  public rollback_to_version!: string | null;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

RollbackRule.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    release_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    failure_threshold: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 5.0,
    },
    time_window_minutes: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 60,
    },
    min_install_attempts: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 10,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    rollback_to_version: {
      type: DataTypes.STRING(50),
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
    tableName: 'rollback_rules',
    modelName: 'RollbackRule',
  }
);
