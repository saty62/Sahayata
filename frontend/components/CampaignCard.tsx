import React from 'react';
import Link from 'next/link';
import { Campaign } from '@/types';
import { Heart, TrendingUp, ShieldCheck, ArrowRight } from 'lucide-react';

interface CampaignCardProps {
  campaign: Campaign;
}

export default function CampaignCard({ campaign }: CampaignCardProps) {
  const percent = campaign.targetAmount > 0
    ? Math.min(100, Math.round((campaign.collectedAmount / campaign.targetAmount) * 100))
    : 0;

  return (
    <article className="bg-white rounded-3xl border border-ivory-border shadow-soft-sm hover:shadow-soft-md transition-all flex flex-col justify-between overflow-hidden group card-hover">
      <div className="p-6 space-y-4">
        {/* Category & Status */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-forest/10 text-forest border border-forest/20 font-hindi">
            {campaign.category}
          </span>
          <div className="flex items-center space-x-1.5">
            <span className="text-[10px] font-bold text-forest bg-sage/60 px-2 py-0.5 rounded border border-sage-dark/40 flex items-center font-hindi">
              <ShieldCheck className="w-3 h-3 mr-1 text-forest" />
              80G मान्य
            </span>
            {campaign.isFeatured && (
              <span className="text-[10px] font-bold text-amber-900 bg-amber-50 px-2 py-0.5 rounded border border-amber-300 font-hindi">
                विशेष
              </span>
            )}
          </div>
        </div>

        {/* Title */}
        <div>
          <h3 className="font-hindi text-lg sm:text-xl font-bold text-charcoal group-hover:text-forest transition-colors leading-snug">
            {campaign.nameHindi}
          </h3>
          <p className="text-xs text-charcoal-muted mt-0.5 line-clamp-1 font-medium">
            {campaign.name}
          </p>
        </div>

        {/* Description in simple Hindi */}
        <p className="font-hindi text-sm text-charcoal-muted line-clamp-3 leading-relaxed">
          {campaign.descriptionHindi}
        </p>

        {/* Progress Bar & Amounts */}
        <div className="space-y-2.5 pt-2">
          <div
            className="w-full bg-[#FAF9F6] h-3 rounded-full overflow-hidden border border-ivory-border"
            role="progressbar"
            aria-valuenow={percent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`${campaign.nameHindi} प्रगति ${percent}%`}
          >
            <div
              className="bg-gradient-to-r from-forest to-forest-light h-full rounded-full transition-all duration-500 ease-out"
              style={{ width: `${percent}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-xs font-hindi">
            <div>
              <span className="text-charcoal-muted">एकत्रित राशि: </span>
              <span className="font-extrabold text-forest text-sm font-sans">
                ₹{campaign.collectedAmount.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="text-right">
              <span className="text-charcoal-muted">लक्ष्य: </span>
              <span className="font-bold text-charcoal font-sans">
                ₹{campaign.targetAmount.toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="px-6 py-4 bg-[#FAF9F6] border-t border-ivory-border flex items-center justify-between">
        <span className="text-xs font-bold text-charcoal-muted flex items-center font-hindi">
          <TrendingUp className="w-4 h-4 mr-1 text-forest" />
          <span>{percent}% पूर्ण</span>
        </span>

        <Link
          href={`/donate?campaignId=${campaign._id}`}
          className="inline-flex items-center px-4 py-2 rounded-xl bg-forest text-white text-xs font-hindi font-bold hover:bg-forest-hover transition-colors shadow-soft-sm touch-target"
        >
          <Heart className="w-3.5 h-3.5 mr-1.5 text-accent fill-current" />
          <span>सहयोग करें (Donate)</span>
        </Link>
      </div>
    </article>
  );
}
