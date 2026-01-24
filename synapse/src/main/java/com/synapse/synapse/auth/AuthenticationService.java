package com.synapse.synapse.auth;

import com.synapse.synapse.auth.request.AuthenticationRequest;
import com.synapse.synapse.auth.request.RefreshRequest;
import com.synapse.synapse.auth.request.RegistrationRequest;
import com.synapse.synapse.auth.response.AuthenticationResponse;

public interface AuthenticationService {

    AuthenticationResponse login(AuthenticationRequest request);

    void register(RegistrationRequest request);

    AuthenticationResponse refreshToken(RefreshRequest req);
}
