import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

interface OrganizationAttributes {
  id: string;
  name: string;
  slug: string;
  api_key: string;
  created_at?: Date;
  updated_at?: Date;
}

interface OrganizationCreationAttributes
  extends Optional<OrganizationAttributes, 'id' | 'created_at' | 'updated_at'> {}

export class Organization
  extends Model<OrganizationAttributes, OrganizationCreationAttributes>
  implements OrganizationAttributes
{
  public id!: string;
  public name!: string;
  public slug!: string;
  public api_key!: string;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

Organization.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    slug: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },
    api_key: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
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
    tableName: 'organizations',
    modelName: 'Organization',
  }
);
