export const mapJobFeedItem = (job = {}) => ({
    id: job.jobId,
    position: job.position,
    company: job.companyName,
    location: job.location,
    salary: {
        min: Number(job.salaryMin),
        max: Number(job.salaryMax)
    },
    tags: (job.skills || []).map((s) => s.skillName || s),
    logo: job.companyImageUrl,
    categoryName: job.categoryName,
    featured: false
});

export const mapAdminJobFeedItem = (job = {}) => ({
    id: job.jobId,
    description: job.description,
    location: job.location,
    companyName: job.companyName,
    subscriptionPlanName: job.subscriptionPlanName,
    categoryName: job.categoryName,
    skills: job.skills || [],
    status: job.status,
    moderationStatus: job.moderationStatus
});
