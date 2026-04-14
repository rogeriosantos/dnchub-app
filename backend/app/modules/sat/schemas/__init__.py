"""SAT module schemas."""

from app.modules.sat.schemas.assistance import (  # noqa: F401
    SatAssistanceCreate,
    SatAssistanceResponse,
    SatAssistanceStatusUpdate,
    SatAssistanceUpdate,
)
from app.modules.sat.schemas.attachment import (  # noqa: F401
    SatAttachmentCreate,
    SatAttachmentResponse,
)
from app.modules.sat.schemas.contact import (  # noqa: F401
    SatContactCreate,
    SatContactResponse,
    SatContactUpdate,
)
from app.modules.sat.schemas.customer import (  # noqa: F401
    SatCustomerCreate,
    SatCustomerResponse,
    SatCustomerUpdate,
)
from app.modules.sat.schemas.intervention_report import (  # noqa: F401
    SatInterventionReportCreate,
    SatInterventionReportResponse,
    SatInterventionReportUpdate,
)
from app.modules.sat.schemas.machine import (  # noqa: F401
    SatMachineCreate,
    SatMachineResponse,
    SatMachineUpdate,
)
from app.modules.sat.schemas.service_type import (  # noqa: F401
    SatServiceTypeCreate,
    SatServiceTypeResponse,
    SatServiceTypeUpdate,
)
from app.modules.sat.schemas.specialization import (  # noqa: F401
    SatSpecializationCreate,
    SatSpecializationResponse,
    SatSpecializationUpdate,
)

__all__ = [
    # Service Type
    "SatServiceTypeCreate",
    "SatServiceTypeUpdate",
    "SatServiceTypeResponse",
    # Specialization
    "SatSpecializationCreate",
    "SatSpecializationUpdate",
    "SatSpecializationResponse",
    # Customer
    "SatCustomerCreate",
    "SatCustomerUpdate",
    "SatCustomerResponse",
    # Contact
    "SatContactCreate",
    "SatContactUpdate",
    "SatContactResponse",
    # Machine
    "SatMachineCreate",
    "SatMachineUpdate",
    "SatMachineResponse",
    # Assistance
    "SatAssistanceCreate",
    "SatAssistanceUpdate",
    "SatAssistanceResponse",
    "SatAssistanceStatusUpdate",
    # Intervention Report
    "SatInterventionReportCreate",
    "SatInterventionReportUpdate",
    "SatInterventionReportResponse",
    # Attachment
    "SatAttachmentCreate",
    "SatAttachmentResponse",
]
