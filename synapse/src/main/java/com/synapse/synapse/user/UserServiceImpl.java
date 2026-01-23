package com.synapse.synapse.user;


import com.synapse.synapse.exception.BusinessException;
import com.synapse.synapse.exception.ErrorCode;
import com.synapse.synapse.user.request.ChangePasswordRequest;
import com.synapse.synapse.user.request.ProfileUpdateRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import static com.synapse.synapse.exception.ErrorCode.*;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final UserMapper userMapper;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        return this.userRepository.findByEmailIgnoreCase(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found by username " + username));
    }

    @Override
    public void updateProfileInfo(ProfileUpdateRequest request, String userId) {
        final User savedUser = this.userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(USER_NOT_FOUND , userId));
        this.userMapper.mergeUserInfo(savedUser, request);
        this.userRepository.save(savedUser);

    }

    @Override
    public void changePassword(ChangePasswordRequest req, String userId){
            if (!req.getNewPassword()
                    .equals(req.getConfirmNewPassword())) {
                throw new BusinessException(CHANGE_PASSWORD_MISMATCH);
            }

            final User savedUser = this.userRepository.findById(userId)
                    .orElseThrow(() -> new BusinessException(USER_NOT_FOUND));

            if (!this.passwordEncoder.matches(req.getCurrentPassword(),
                    savedUser.getPassword())) {
                throw new BusinessException(INVALID_CURRENT_PASSWORD);
            }

            final String encoded = this.passwordEncoder.encode(req.getNewPassword());
            savedUser.setPassword(encoded);
            this.userRepository.save(savedUser);
        }



    @Override
    public void deactivateAccount(String userId) {

        final User user = this.userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(USER_NOT_FOUND));

        if (!user.isEnabled()) {
            throw new BusinessException(ErrorCode.ACCOUNT_ALREADY_DEACTIVATED);
        }

        user.setEnabled(false);
        this.userRepository.save(user);

    }

    @Override
    public void reactivateAccount(String userId) {
        final User user = this.userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(USER_NOT_FOUND));

        if (user.isEnabled()) {
            throw new BusinessException(ErrorCode.ACCOUNT_ALREADY_DEACTIVATED);
        }

        user.setEnabled(true);
        this.userRepository.save(user);

    }

    @Override
    public void deleteAccount(String userId) {

    }


}
