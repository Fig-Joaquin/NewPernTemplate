import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  BeforeInsert,
  BeforeUpdate
} from "typeorm";
import * as bcrypt from "bcrypt";

@Entity("users")
@Index(["email"], { unique: true })
export class User {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ 
    type: "varchar", 
    length: 255, 
    unique: true,
    transformer: {
      to: (value: string) => value?.toLowerCase().trim(),
      from: (value: string) => value
    }
  })
  email: string;

  @Column({ 
    type: "varchar", 
    length: 255,
    select: false // Por defecto no incluir en queries
  })
  password: string;

  @Column({ 
    type: "varchar", 
    length: 100,
    transformer: {
      to: (value: string) => value?.trim(),
      from: (value: string) => value
    }
  })
  firstName: string;

  @Column({ 
    type: "varchar", 
    length: 100,
    transformer: {
      to: (value: string) => value?.trim(),
      from: (value: string) => value
    }
  })
  lastName: string;

  @Column({ 
    type: "date", 
    nullable: true 
  })
  dateOfBirth: Date | null;

  @Column({ 
    type: "enum", 
    enum: ["male", "female", "other", "prefer_not_to_say"],
    nullable: true 
  })
  gender: "male" | "female" | "other" | "prefer_not_to_say" | null;

  @Column({ 
    type: "varchar", 
    length: 20, 
    nullable: true 
  })
  phoneNumber: string | null;

  @Column({ 
    type: "boolean", 
    default: true 
  })
  isActive: boolean;

  @Column({ 
    type: "boolean", 
    default: false 
  })
  isEmailVerified: boolean;

  @Column({ 
    type: "timestamp", 
    nullable: true 
  })
  emailVerifiedAt: Date | null;

  @Column({ 
    type: "timestamp", 
    nullable: true 
  })
  lastLoginAt: Date | null;

  @CreateDateColumn({ 
    type: "timestamp",
    default: () => "CURRENT_TIMESTAMP"
  })
  createdAt: Date;

  @UpdateDateColumn({ 
    type: "timestamp",
    default: () => "CURRENT_TIMESTAMP",
    onUpdate: "CURRENT_TIMESTAMP"
  })
  updatedAt: Date;

  // Virtual property para nombre completo
  get fullName(): string {
    return `${this.firstName} ${this.lastName}`.trim();
  }

  // Método para verificar contraseña
  async comparePassword(candidatePassword: string): Promise<boolean> {
    return bcrypt.compare(candidatePassword, this.password);
  }

  // Hash password antes de insertar
  @BeforeInsert()
  async hashPassword() {
    if (this.password) {
      this.password = await bcrypt.hash(this.password, 12);
    }
  }

  // Hash password antes de actualizar (solo si cambió)
  @BeforeUpdate()
  async hashPasswordOnUpdate() {
    // Solo hash si la contraseña fue modificada
    if (this.password && !this.password.startsWith('$2b$')) {
      this.password = await bcrypt.hash(this.password, 12);
    }
  }

  // Método para serializar (sin datos sensibles)
  toJSON() {
    const { password, ...userWithoutPassword } = this;
    return userWithoutPassword;
  }
}
