"""SAT module services."""

from app.modules.sat.services.assistance import sat_assistance_service, SatAssistanceService
from app.modules.sat.services.attachment import sat_attachment_service, SatAttachmentService
from app.modules.sat.services.contact import sat_contact_service, SatContactService
from app.modules.sat.services.customer import sat_customer_service, SatCustomerService
from app.modules.sat.services.intervention_report import (
    sat_intervention_report_service,
    SatInterventionReportService,
)
from app.modules.sat.services.machine import sat_machine_service, SatMachineService
from app.modules.sat.services.service_type import sat_service_type_service, SatServiceTypeService
from app.modules.sat.services.specialization import sat_specialization_service, SatSpecializationService

__all__ = [
    "sat_assistance_service",
    "SatAssistanceService",
    "sat_attachment_service",
    "SatAttachmentService",
    "sat_contact_service",
    "SatContactService",
    "sat_customer_service",
    "SatCustomerService",
    "sat_intervention_report_service",
    "SatInterventionReportService",
    "sat_machine_service",
    "SatMachineService",
    "sat_service_type_service",
    "SatServiceTypeService",
    "sat_specialization_service",
    "SatSpecializationService",
]
