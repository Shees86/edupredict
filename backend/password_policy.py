PASSWORD_POLICY_ERROR = (
    "Password must be at least 10 characters and include at least one letter "
    "and one digit."
)


def validate_password(password):
    if (
        not isinstance(password, str)
        or len(password) < 10
        or not any(character.isalpha() for character in password)
        or not any(character.isdigit() for character in password)
    ):
        return PASSWORD_POLICY_ERROR
    return None
