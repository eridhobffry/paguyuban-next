import { relations } from "drizzle-orm/relations";
import { partnershipApplications, partnershipApplicationRecommendations, sponsorTiers, sponsors, sponsorLogos } from "./schema";

export const partnershipApplicationRecommendationsRelations = relations(partnershipApplicationRecommendations, ({one}) => ({
	partnershipApplication: one(partnershipApplications, {
		fields: [partnershipApplicationRecommendations.applicationId],
		references: [partnershipApplications.id]
	}),
}));

export const partnershipApplicationsRelations = relations(partnershipApplications, ({many}) => ({
	partnershipApplicationRecommendations: many(partnershipApplicationRecommendations),
}));

export const sponsorsRelations = relations(sponsors, ({one, many}) => ({
	sponsorTier: one(sponsorTiers, {
		fields: [sponsors.tierId],
		references: [sponsorTiers.id]
	}),
	sponsorLogos: many(sponsorLogos),
}));

export const sponsorTiersRelations = relations(sponsorTiers, ({many}) => ({
	sponsors: many(sponsors),
}));

export const sponsorLogosRelations = relations(sponsorLogos, ({one}) => ({
	sponsor: one(sponsors, {
		fields: [sponsorLogos.sponsorId],
		references: [sponsors.id]
	}),
}));