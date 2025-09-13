import type { BlogPost, Event } from '../types';

export const mockBlogPosts: BlogPost[] = [
    {
        id: 'blog-1',
        title: 'The Future of Wearable Technology',
        excerpt: 'From smart rings to neural interfaces, we explore the cutting-edge innovations that are set to redefine our relationship with technology.',
        imageUrl: 'https://picsum.photos/seed/blog_wearables/600/400',
    },
    {
        id: 'blog-2',
        title: 'Art & AI: A New Creative Frontier',
        excerpt: 'Discover how artists are leveraging artificial intelligence to create breathtaking new forms of generative and interactive art.',
        imageUrl: 'https://picsum.photos/seed/blog_art_ai/600/400',
    },
    {
        id: 'blog-3',
        title: 'Sustainable Design: Building a Better Future',
        excerpt: 'Innovators are rethinking everything from materials to manufacturing. Learn about the projects making a positive impact on our planet.',
        imageUrl: 'https://picsum.photos/seed/blog_sustainability/600/400',
    },
];

export const mockEvents: Event[] = [
    {
        id: 'event-1',
        title: 'Transfornation Launch Summit 2024',
        date: 'October 26, 2024',
        location: 'Virtual Event',
        imageUrl: 'https://picsum.photos/seed/event_summit/600/400',
        description: 'Join us for the official launch of Transfornation! We\'re bringing together creators, backers, and industry leaders for a day of inspiring talks, project demos, and networking. Discover the future of impact projects in Central Asia and be the first to see our most anticipated projects go live.',
        speakers: [
            { name: 'Dr. Evelyn Reed', title: 'CEO, Transfornation Labs', avatar: 'https://i.pravatar.cc/150?u=evelyn_reed' },
            { name: 'Kenji Tanaka', title: 'Lead Designer, Chronoscape', avatar: 'https://i.pravatar.cc/150?u=kenji_tanaka' },
            { name: 'Sophia Chen', title: 'Artist & Creator, Luminance', avatar: 'https://i.pravatar.cc/150?u=sophia_chen' },
        ],
    },
    {
        id: 'event-2',
        title: 'Creator Workshop: Mastering Your Campaign',
        date: 'November 15, 2024',
        location: 'Online Workshop',
        imageUrl: 'https://picsum.photos/seed/event_workshop/600/400',
        description: 'Ready to launch your own impact project? This hands-on workshop will guide you through the essentials of creating a successful impact project campaign, from storytelling and video production to marketing and community building. Learn from creators who have successfully funded their dreams on Transfornation.',
        speakers: [
            { name: 'Alex Carter', title: 'Impact Project Strategist', avatar: 'https://i.pravatar.cc/150?u=alex_carter' },
            { name: 'Maria Rodriguez', title: 'Founder, Ergo Designs', avatar: 'https://i.pravatar.cc/150?u=maria_rodriguez' },
        ],
    },
];