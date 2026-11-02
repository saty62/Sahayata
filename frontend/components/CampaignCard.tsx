import React from 'react';
import Link from 'next/link';
import { Campaign } from '@/types';
import { Heart, Target, TrendingUp, Users } from 'lucide-react';

interface CampaignCardProps {
  campaign: Campaign;
}

export default function CampaignCard({ campaign }: CampaignCardProps) {
  const percent = campaign.targetAmount > 0
    ? Math.min(100, Math.round((campaign.collectedAmount / campaign.targetAmount) * 100))
    : 0;

  return (
    <div className="bg-white rounded-2xl border border-[#E8E5DD] shadow-soft-sm hover:shadow-soft-md transition-all flex flex-col justify-between overflow-hidden group">
      <div className="p-6 space-y-4">
        {/* Category & Status */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-forest/10 text-forest border border-forest/20">
            {campaign.category}
          </span>
          {campaign.isFeatured && (
            <span className="text-xs font-semibold text-accent-dark bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
              विशेष अभियान (Featured)
            </span>
          )}
        </div>

        {/* Title */}
        <div>
          <h3 className="font-hindi text-lg font-bold text-charcoal group-hover:text-forest transition-colors leading-snug">
            {campaign.nameHindi}
          </h3>
          <p className="text-xs text-charcoal-muted mt-1 line-clamp-1">
            {campaign.name}
          </p>
        </div>

        {/* Description in simple Hindi */}
        <p className="font-hindi text-sm text-charcoal-muted line-clamp-3 leading-relaxed">
          {campaign.descriptionHindi}
        </p>

        {/* Progress Bar & Amounts */}
        <div className="space-y-2 pt-2">
          <div className="w-full bg-[#FAF9F6] h-3 rounded-full overflow-hidden border border-[#E8E5DD]">
            <div
              className="bg-forest h-full rounded-full transition-all duration-500 ease-out"
              style={{ width: `${percent}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-xs">
            <div>
              <span className="text-charcoal-muted">एकत्रित (Collected): </span>
              <span className="font-bold text-forest text-sm">
                ₹{campaign.collectedAmount.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="text-right">
              <span className="text-charcoal-muted">लक्ष्य (Goal): </span>
              <span className="font-semibold text-charcoal">
                ₹{campaign.targetAmount.toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="px-6 py-4 bg-[#FAF9F6] border-t border-[#E8E5DD] flex items-center justify-between">
        <span className="text-xs font-semibold text-charcoal-muted flex items-center">
          <TrendingUp className="w-4 h-4 mr-1 text-forest" />
          <span>{percent}% पूर्ण</span>
        </span>

        <Link
          href={`/donate?campaignId=${campaign._id}`}
          className="inline-flex items-center px-4 py-2 rounded-lg bg-forest text-white text-xs font-semibold hover:bg-forest-hover transition-colors shadow-soft-sm"
        >
          <Heart className="w-3.5 h-3.5 mr-1.5 text-accent fill-current" />
          <span>सहयोग करें (Donate)</span>
        </Link>
      </div>
    </div>
  );
}
