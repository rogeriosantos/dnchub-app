"""SAT attachment service."""

from app.modules.sat.models.attachment import SatAttachment
from app.modules.sat.schemas.attachment import SatAttachmentCreate
from app.shared.schemas.base import BaseSchema
from app.shared.services.base import BaseService


class SatAttachmentService(BaseService[SatAttachment, SatAttachmentCreate, BaseSchema]):
    """SAT attachment service - simple BaseService wrapper."""

    def __init__(self):
        super().__init__(SatAttachment)


sat_attachment_service = SatAttachmentService()
