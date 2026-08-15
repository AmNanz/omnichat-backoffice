import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class OmnichatIntegrationService {
  private readonly logger = new Logger(OmnichatIntegrationService.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  private get baseUrl(): string | undefined {
    return this.configService.get<string>('OMNICHAT_API_URL') ?? undefined;
  }

  private get token(): string | undefined {
    const token = this.configService.get<string>('OMNICHAT_API_TOKEN');
    return token && token.trim() ? token : undefined;
  }

  private get enabled(): boolean {
    return Boolean(this.baseUrl && this.token);
  }

  async provisionCompany(payload: {
    name: string;
    slug: string;
    backofficeCompanyId: string;
  }): Promise<{ id: string } | null> {
    if (!this.enabled) {
      this.logger.log(
        `Omnichat provisionCompany skipped (no token): ${payload.slug}`,
      );
      return null;
    }
    try {
      const response = await firstValueFrom(
        this.httpService.post(
          `${this.baseUrl}/internal/companies`,
          payload,
          {
            headers: { Authorization: `Bearer ${this.token}` },
            timeout: 10000,
          },
        ),
      );
      const id =
        (response.data as { id?: string; _id?: string })?.id ??
        (response.data as { _id?: string })?._id;
      return id ? { id: String(id) } : null;
    } catch (error) {
      this.logger.warn(
        `Omnichat provisionCompany failed: ${(error as Error).message}`,
      );
      return null;
    }
  }

  async provisionUser(payload: {
    email: string;
    displayName: string;
    backofficeUserId: string;
  }): Promise<{ id: string } | null> {
    if (!this.enabled) {
      this.logger.log(
        `Omnichat provisionUser skipped (no token): ${payload.email}`,
      );
      return null;
    }
    try {
      const response = await firstValueFrom(
        this.httpService.post(`${this.baseUrl}/internal/users`, payload, {
          headers: { Authorization: `Bearer ${this.token}` },
          timeout: 10000,
        }),
      );
      const id =
        (response.data as { id?: string; _id?: string })?.id ??
        (response.data as { _id?: string })?._id;
      return id ? { id: String(id) } : null;
    } catch (error) {
      this.logger.warn(
        `Omnichat provisionUser failed: ${(error as Error).message}`,
      );
      return null;
    }
  }

  async disableCompany(omnichatCompanyId: string): Promise<void> {
    if (!this.enabled) {
      this.logger.log(
        `Omnichat disableCompany skipped (no token): ${omnichatCompanyId}`,
      );
      return;
    }
    try {
      await firstValueFrom(
        this.httpService.post(
          `${this.baseUrl}/internal/companies/${omnichatCompanyId}/disable`,
          {},
          {
            headers: { Authorization: `Bearer ${this.token}` },
            timeout: 10000,
          },
        ),
      );
    } catch (error) {
      this.logger.warn(
        `Omnichat disableCompany failed: ${(error as Error).message}`,
      );
    }
  }
}
