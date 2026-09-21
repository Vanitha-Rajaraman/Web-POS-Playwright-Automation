async function unwrap(responsePromise) {
    const response = await responsePromise;
    if (!response.ok()) {
        throw new Error(`API call failed: ${response.status()} ${response.url()}`);
    }
    const body = await response.json();
    return body.data;
}
export class AuthApi {
    constructor(request) {
        this.request = request;
    }
    async getRetailUser(mobile, primaryPassword) {
        return unwrap(this.request.post('/proxy/auth/retail/user', {
            data: { mobile, primaryPassword },
        }));
    }
    async getUserOrgs(uidx) {
        return unwrap(this.request.get('/proxy/user-service/user/orgs/uidx', {
            params: { uidx },
        }));
    }
    async getDisplayMode(uidx) {
        return unwrap(this.request.get('/proxy/user-service/user/display/mode', { params: { uidx } }));
    }
}
