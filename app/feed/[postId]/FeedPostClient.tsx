'use client';

import { Share2 } from 'lucide-react';
import { FeedPost } from '@/types';

interface FeedPostClientProps {
  post: FeedPost;
}

export default function FeedPostClient({ post }: FeedPostClientProps) {
  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();

    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const postUrl = `${origin}/feed/${post.id}`;
    const shareText = `Check out this update from Gramakam 2026: "${post.title}" - ${post.description.substring(0, 80)}...`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `${post.title} - Gramakam 2026`,
          text: shareText,
          url: postUrl,
        });
      } catch (err) {
        // User cancelled share
      }
    } else {
      // Fallback: create platform-specific share links
      const encodedUrl = encodeURIComponent(postUrl);
      const encodedText = encodeURIComponent(shareText);

      const whatsappUrl = `https://wa.me/?text=${encodedText}%20${encodedUrl}`;
      const twitterUrl = `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`;
      const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;

      // Create a simple menu of share options
      const shareOptions = [
        { name: 'WhatsApp', url: whatsappUrl },
        { name: 'Twitter', url: twitterUrl },
        { name: 'Facebook', url: facebookUrl },
        {
          name: 'Copy Link',
          action: () => {
            navigator.clipboard.writeText(postUrl);
            alert('Link copied to clipboard!');
          },
        },
      ];

      // Show popup menu
      const menu = document.createElement('div');
      menu.className =
        'fixed z-50 bg-white rounded-lg shadow-lg p-2 border border-gray-200';
      menu.style.top = '50%';
      menu.style.left = '50%';
      menu.style.transform = 'translate(-50%, -50%)';

      shareOptions.forEach((option) => {
        const button = document.createElement('button');
        button.className =
          'block w-full text-left px-4 py-2 hover:bg-gray-100 rounded text-gray-700 text-sm';
        button.textContent = option.name;

        if (option.action) {
          button.onclick = () => {
            option.action();
            menu.remove();
          };
        } else {
          button.onclick = () => {
            window.open(option.url, '_blank', 'width=600,height=400');
            menu.remove();
          };
        }

        menu.appendChild(button);
      });

      const closeBtn = document.createElement('button');
      closeBtn.className =
        'block w-full text-left px-4 py-2 hover:bg-gray-100 rounded text-gray-500 text-sm mt-1 border-t';
      closeBtn.textContent = 'Close';
      closeBtn.onclick = () => menu.remove();
      menu.appendChild(closeBtn);

      document.body.appendChild(menu);

      // Close menu on outside click
      const closeOnClickOutside = (e: MouseEvent) => {
        if (!menu.contains(e.target as Node)) {
          menu.remove();
          document.removeEventListener('click', closeOnClickOutside);
        }
      };

      setTimeout(() => {
        document.addEventListener('click', closeOnClickOutside);
      }, 0);
    }
  };

  return (
    <button
      onClick={handleShare}
      className="p-2 text-gray-400 hover:text-maroon transition-colors rounded-lg hover:bg-gray-100"
      title="Share this post"
      aria-label="Share"
    >
      <Share2 size={20} />
    </button>
  );
}
