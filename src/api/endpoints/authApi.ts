import { APIRequestContext } from '@playwright/test';

export interface RetailUser {
  uidx: string;
  mobileNumber: string;
  email: string;
  firstName: string;
  secondName: string;
  id: number;
  roles: string[];
  contexts: Record<
    string,
    {
      meta: Array<{ row_id: number; type: string; contextId: string; org_id: string }>;
    }
  >;
}

export interface OrgsForUserResponse {
  userDetails: RetailUser;
}

async function unwrap<T>(responsePromise: Promise<import('@playwright/test').APIResponse>): Promise<T> {
  const response = await responsePromise;
  if (!response.ok()) {
    throw new Error(`API call failed: ${response.status()} ${response.url()}`);
  }
  const body = await response.json();
  return body.data as T;
}

export class AuthApi {
  constructor(private readonly request: APIRequestContext) {}

  async getRetailUser(mobile: string, primaryPassword: string): Promise<RetailUser> {
    return unwrap<RetailUser>(
      this.request.post('/proxy/auth/retail/user', {
        data: { mobile, primaryPassword },
      })
    );
  }

  async getUserOrgs(uidx: string): Promise<OrgsForUserResponse> {
    return unwrap<OrgsForUserResponse>(this.request.get('/proxy/user-service/user/orgs/uidx', {
      params: { uidx },
    }));
  }

  async getDisplayMode(uidx: string): Promise<{ displayMode: string }> {
    return unwrap<{ displayMode: string }>(
      this.request.get('/proxy/user-service/user/display/mode', { params: { uidx } })
    );
  }
}
