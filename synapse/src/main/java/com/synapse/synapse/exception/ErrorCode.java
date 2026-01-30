package com.synapse.synapse.exception;


import lombok.Getter;
import org.springframework.http.HttpStatus;

import static org.springframework.http.HttpStatus.*;

@Getter
public enum ErrorCode {

    EMAIL_ALREADY_EXISTS("ERR_EMAIL_EXISTS", "Email already exists", CONFLICT),

    PASSWORD_MISMATCH("ERR_PASSWORD_MISMATCH", "The password and confirmation do not match", BAD_REQUEST),
    CHANGE_PASSWORD_MISMATCH("ERR_PASSWORD_MISMATCH", "New password and confirmation do not match", BAD_REQUEST),
    ERR_SENDING_ACTIVATION_EMAIL("ERR_SENDING_ACTIVATION_EMAIL",
            "An error occurred while sending the activation email",
            HttpStatus.INTERNAL_SERVER_ERROR),

    ERR_USER_DISABLED("ERR_USER_DISABLED",
            "User account is disabled, please activate your account or contact the administrator",
            UNAUTHORIZED),
    INVALID_CURRENT_PASSWORD("INVALID_CURRENT_PASSWORD", "The current password is incorrect", BAD_REQUEST),
    USER_NOT_FOUND("USER_NOT_FOUND", "User not found", NOT_FOUND),
    ACCOUNT_ALREADY_DEACTIVATED("ACCOUNT_ALREADY_DEACTIVATED", "Account has been deactivated", BAD_REQUEST),
    BAD_CREDENTIALS("BAD_CREDENTIALS", "Username and / or password is incorrect", UNAUTHORIZED),
    INTERNAL_EXCEPTION("INTERNAL_EXCEPTION",
            "An internal exception occurred, please try again or contact the admin",
            HttpStatus.INTERNAL_SERVER_ERROR),
    USERNAME_NOT_FOUND("USERNAME_NOT_FOUND", "Cannot find user with the provided username", NOT_FOUND),

    BOARD_NOT_FOUND(
            "ERR_BOARD_NOT_FOUND",
            "Board not found",
            HttpStatus.NOT_FOUND
    ),

    BOARD_ACCESS_DENIED(
            "ERR_BOARD_ACCESS_DENIED",
            "You are not allowed to access this board",
            HttpStatus.FORBIDDEN
    ),
    NOTE_NOT_FOUND(
            "ERR_NOTE_NOT_FOUND",
            "Note not found",
            HttpStatus.NOT_FOUND
    ),
    LINK_NOT_FOUND(
            "ERR_LINK_NOT_FOUND",
            "Link not found",
            HttpStatus.NOT_FOUND
    ),
    FILE_UPLOAD_FAILED(
            "ERR_FILE_UPLOAD_FAILED",
            "Image upload failed. Please try again.",
            HttpStatus.INTERNAL_SERVER_ERROR
    ),
    FILE_EMPTY(
            "ERR_FILE_EMPTY",
            "Uploaded file is empty",
            HttpStatus.BAD_REQUEST
    ),

    INVALID_FILE_TYPE(
            "ERR_INVALID_FILE_TYPE",
            "Only image files are allowed",
            HttpStatus.BAD_REQUEST
    ),
    INVALID_ACTIVATION_CODE(
            "ERR_INVALID_ACTIVATION_CODE",
            "Invalid activation code",
            HttpStatus.BAD_REQUEST
    ),

    ACTIVATION_CODE_EXPIRED(
            "ERR_ACTIVATION_CODE_EXPIRED",
            "Activation code has expired",
            HttpStatus.BAD_REQUEST
    ),

    ACTIVATION_CODE_ALREADY_USED(
            "ERR_ACTIVATION_CODE_ALREADY_USED",
            "Activation code has already been used",
            HttpStatus.BAD_REQUEST
    )

    ;

    private final String code;
    private final String defaultMessage;
    private final HttpStatus status;

    ErrorCode(final String code,
              final String defaultMessage,
              final HttpStatus status) {
        this.code = code;
        this.defaultMessage = defaultMessage;
        this.status = status;
    }
}
