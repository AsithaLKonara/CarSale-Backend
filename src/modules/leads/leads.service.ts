import { prisma } from '../../lib/prisma';

export interface LeadFilterQuery {
  status?: string;
  priority?: string;
}

export interface LeadCreateInput {
  name: string;
  email: string;
  phone?: string;
  message?: string;
  source?: string;
  priority?: string;
}

class LeadsService {
  /**
   * List leads with filtering.
   */
  public async getLeadsList(filters: LeadFilterQuery, organizationId?: string) {
    const where: any = {};
    if (organizationId) {
      where.organizationId = organizationId;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.priority) {
      where.priority = filters.priority;
    }

    return prisma.lead.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Create a new client lead inquiry.
   */
  public async createLead(data: LeadCreateInput, organizationId?: string) {
    return prisma.lead.create({
      data: {
        ...data,
        organizationId,
      },
    });
  }

  /**
   * Update lead properties (status, priority, details).
   */
  public async updateLead(
    id: string, 
    data: Partial<LeadCreateInput> & { status?: string; followUpDate?: Date | string }, 
    organizationId?: string
  ) {
    const { followUpDate, ...rest } = data;
    return prisma.lead.update({
      where: { id },
      data: {
        ...rest,
        followUpDate: followUpDate ? new Date(followUpDate) : undefined,
      },
    });
  }

  /**
   * Delete a lead profile.
   */
  public async deleteLead(id: string, organizationId?: string) {
    await prisma.lead.delete({
      where: { id },
    });
    return true;
  }
}

export const leadsService = new LeadsService();
export default leadsService;
