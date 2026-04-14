"""SAT module models."""

from app.modules.sat.models.attachment import SatAttachment
from app.modules.sat.models.assistance import SatAssistance
from app.modules.sat.models.contact import SatContact
from app.modules.sat.models.customer import SatCustomer
from app.modules.sat.models.employee_specialization import SatEmployeeSpecialization
from app.modules.sat.models.intervention_report import SatInterventionReport
from app.modules.sat.models.machine import SatMachine
from app.modules.sat.models.service_type import SatServiceType
from app.modules.sat.models.specialization import SatSpecialization

__all__ = [
    "SatAttachment",
    "SatAssistance",
    "SatContact",
    "SatCustomer",
    "SatEmployeeSpecialization",
    "SatInterventionReport",
    "SatMachine",
    "SatServiceType",
    "SatSpecialization",
]
