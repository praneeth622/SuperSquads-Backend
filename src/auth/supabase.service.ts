import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Environment } from '../config/env.schema';

@Injectable()
export class SupabaseService {
  private supabase: SupabaseClient;

  constructor(private configService: ConfigService<Environment>) {
    this.supabase = createClient(
      this.configService.get('SUPABASE_PROJECT_URL')!,
      this.configService.get('SUPABASE_ANON_KEY')!,
    );
  }

  getClient(): SupabaseClient {
    return this.supabase;
  }

  async verifyJWT(token: string): Promise<any> {
    try {
      const { data: user, error } = await this.supabase.auth.getUser(token);
      
      if (error) {
        throw new Error(`JWT verification failed: ${error.message}`);
      }

      return user;
    } catch (error) {
      throw new Error(`JWT verification failed: ${error.message}`);
    }
  }
}
