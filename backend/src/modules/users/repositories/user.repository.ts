import { Repository, SelectQueryBuilder } from "typeorm";
import { AppDataSource } from "../../../config/database";
import { User } from "../entities/user.entity";
import { CreateUserDto, UpdateUserDto, UserQueryDto } from "../dto/user.dto";

export interface IUserRepository {
  create(userData: CreateUserDto): Promise<User>;
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findByEmailWithPassword(email: string): Promise<User | null>;
  findAll(query: UserQueryDto): Promise<{ users: User[]; total: number; totalPages: number }>;
  update(id: string, userData: UpdateUserDto): Promise<User | null>;
  softDelete(id: string): Promise<boolean>;
  hardDelete(id: string): Promise<boolean>;
  updateLastLogin(id: string): Promise<void>;
  verifyEmail(id: string): Promise<boolean>;
  changePassword(id: string, hashedPassword: string): Promise<boolean>;
  countActive(): Promise<number>;
  findRecentUsers(hours?: number): Promise<User[]>;
}

export class UserRepository implements IUserRepository {
  private readonly repository: Repository<User>;

  constructor() {
    this.repository = AppDataSource.getRepository(User);
  }

  /**
   * Crear un nuevo usuario
   */
  async create(userData: CreateUserDto): Promise<User> {
    try {
      const user = this.repository.create({
        email: userData.email,
        password: userData.password,
        firstName: userData.firstName,
        lastName: userData.lastName,
        dateOfBirth: userData.dateOfBirth || null,
        gender: userData.gender || null,
        phoneNumber: userData.phoneNumber || null,
      });
      return await this.repository.save(user);
    } catch (error) {
      if (error instanceof Error && error.message.includes('duplicate key')) {
        throw new Error('Email already exists');
      }
      throw error;
    }
  }

  /**
   * Buscar usuario por ID (sin contraseña)
   */
  async findById(id: string): Promise<User | null> {
    return await this.repository.findOne({
      where: { id, isActive: true },
    });
  }

  /**
   * Buscar usuario por email (sin contraseña)
   */
  async findByEmail(email: string): Promise<User | null> {
    return await this.repository.findOne({
      where: { email: email.toLowerCase().trim(), isActive: true },
    });
  }

  /**
   * Buscar usuario por email incluyendo contraseña (para login)
   */
  async findByEmailWithPassword(email: string): Promise<User | null> {
    return await this.repository.findOne({
      where: { email: email.toLowerCase().trim(), isActive: true },
      select: [
        "id", "email", "password", "firstName", "lastName", 
        "isActive", "isEmailVerified", "createdAt", "updatedAt"
      ]
    });
  }

  /**
   * Obtener todos los usuarios con paginación y filtros
   */
  async findAll(query: UserQueryDto): Promise<{ users: User[]; total: number; totalPages: number }> {
    const { page, limit, search, isActive, gender, sortBy, sortOrder } = query;
    
    let queryBuilder: SelectQueryBuilder<User> = this.repository
      .createQueryBuilder("user");

    // Aplicar filtros
    if (isActive !== undefined) {
      queryBuilder = queryBuilder.andWhere("user.isActive = :isActive", { isActive });
    } else {
      queryBuilder = queryBuilder.andWhere("user.isActive = true");
    }

    if (gender) {
      queryBuilder = queryBuilder.andWhere("user.gender = :gender", { gender });
    }

    if (search) {
      queryBuilder = queryBuilder.andWhere(
        "(user.firstName ILIKE :search OR user.lastName ILIKE :search OR user.email ILIKE :search)",
        { search: `%${search}%` }
      );
    }

    // Ordenamiento
    const order = sortOrder.toUpperCase() as "ASC" | "DESC";
    queryBuilder = queryBuilder.orderBy(`user.${sortBy}`, order);

    // Paginación
    const offset = (page - 1) * limit;
    queryBuilder = queryBuilder.skip(offset).take(limit);

    // Ejecutar query
    const [users, total] = await queryBuilder.getManyAndCount();
    const totalPages = Math.ceil(total / limit);

    return { users, total, totalPages };
  }

  /**
   * Actualizar usuario
   */
  async update(id: string, userData: UpdateUserDto): Promise<User | null> {
    try {
      const updateData: Partial<User> = {
        updatedAt: new Date()
      };

      if (userData.firstName !== undefined) {
        updateData.firstName = userData.firstName;
      }
      if (userData.lastName !== undefined) {
        updateData.lastName = userData.lastName;
      }
      if (userData.dateOfBirth !== undefined) {
        updateData.dateOfBirth = userData.dateOfBirth || null;
      }
      if (userData.gender !== undefined) {
        updateData.gender = userData.gender || null;
      }
      if (userData.phoneNumber !== undefined) {
        updateData.phoneNumber = userData.phoneNumber || null;
      }

      const updateResult = await this.repository.update(
        { id, isActive: true }, 
        updateData
      );

      if (updateResult.affected === 0) {
        return null;
      }

      return await this.findById(id);
    } catch (error) {
      if (error instanceof Error && error.message.includes('duplicate key')) {
        throw new Error('Email already exists');
      }
      throw error;
    }
  }

  /**
   * Soft delete - marcar como inactivo
   */
  async softDelete(id: string): Promise<boolean> {
    const result = await this.repository.update(
      { id, isActive: true },
      { isActive: false, updatedAt: new Date() }
    );
    return (result.affected ?? 0) > 0;
  }

  /**
   * Hard delete - eliminar permanentemente
   */
  async hardDelete(id: string): Promise<boolean> {
    const result = await this.repository.delete({ id });
    return (result.affected ?? 0) > 0;
  }

  /**
   * Actualizar último login
   */
  async updateLastLogin(id: string): Promise<void> {
    await this.repository.update(
      { id },
      { lastLoginAt: new Date(), updatedAt: new Date() }
    );
  }

  /**
   * Verificar email del usuario
   */
  async verifyEmail(id: string): Promise<boolean> {
    const result = await this.repository.update(
      { id, isActive: true },
      { 
        isEmailVerified: true, 
        emailVerifiedAt: new Date(),
        updatedAt: new Date()
      }
    );
    return (result.affected ?? 0) > 0;
  }

  /**
   * Contar usuarios activos
   */
  async countActive(): Promise<number> {
    return await this.repository.count({ where: { isActive: true } });
  }

  /**
   * Buscar usuarios creados en las últimas X horas
   */
  async findRecentUsers(hours: number = 24): Promise<User[]> {
    const date = new Date();
    date.setHours(date.getHours() - hours);

    return await this.repository.find({
      where: {
        createdAt: date as any, // TypeORM MoreThanOrEqual
        isActive: true
      },
      order: { createdAt: "DESC" },
      take: 100
    });
  }

  /**
   * Cambiar contraseña
   */
  async changePassword(id: string, hashedPassword: string): Promise<boolean> {
    const result = await this.repository.update(
      { id, isActive: true },
      { password: hashedPassword, updatedAt: new Date() }
    );
    return (result.affected ?? 0) > 0;
  }
}
