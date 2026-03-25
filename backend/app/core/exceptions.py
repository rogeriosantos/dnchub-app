"""Custom exceptions for the application."""

from typing import Any


class FleetOptimaException(Exception):
    """Base exception for FleetOptima application."""

    def __init__(
        self,
        message: str = "An error occurred",
        status_code: int = 500,
        details: dict[str, Any] | None = None,
    ):
        self.message = message
        self.status_code = status_code
        self.details = details or {}
        super().__init__(self.message)


class NotFoundError(FleetOptimaException):
    """Resource not found exception."""

    def __init__(
        self,
        resource: str = "Resource",
        resource_id: str | None = None,
    ):
        message = f"{resource} not found"
        if resource_id:
            message = f"{resource} with id '{resource_id}' not found"
        super().__init__(message=message, status_code=404)


class ValidationError(FleetOptimaException):
    """Validation error exception."""

    def __init__(
        self,
        message: str = "Validation error",
        details: dict[str, Any] | None = None,
    ):
        super().__init__(message=message, status_code=422, details=details)


class AuthenticationError(FleetOptimaException):
    """Authentication error exception."""

    def __init__(self, message: str = "Authentication failed"):
        super().__init__(message=message, status_code=401)


class AuthorizationError(FleetOptimaException):
    """Authorization error exception."""

    def __init__(self, message: str = "Permission denied"):
        super().__init__(message=message, status_code=403)


class ConflictError(FleetOptimaException):
    """Conflict error exception (e.g., duplicate resource)."""

    def __init__(
        self,
        message: str = "Resource already exists",
        details: dict[str, Any] | None = None,
    ):
        super().__init__(message=message, status_code=409, details=details)


class BadRequestError(FleetOptimaException):
    """Bad request error exception."""

    def __init__(
        self,
        message: str = "Bad request",
        details: dict[str, Any] | None = None,
    ):
        super().__init__(message=message, status_code=400, details=details)
