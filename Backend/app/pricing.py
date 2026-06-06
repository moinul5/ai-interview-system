from fastapi import APIRouter

router = APIRouter(prefix="/pricing", tags=["Pricing"])


@router.get("/plans")
def get_pricing_plans():
    return {
        "success": True,
        "plans": [
            {
                "id": 1,
                "name": "Free Plan",
                "price": 0,
                "currency": "BDT",
                "duration": "monthly",
                "description": "Basic access for students to practice interviews.",
                "features": [
                    "Limited resume analysis",
                    "Basic interview practice",
                    "Basic feedback"
                ],
                "button_text": "Start Free"
            },
            {
                "id": 2,
                "name": "Pro Plan",
                "price": 499,
                "currency": "BDT",
                "duration": "monthly",
                "description": "Advanced interview preparation with AI feedback.",
                "features": [
                    "Unlimited resume analysis",
                    "Text interview practice",
                    "Voice interview practice",
                    "AI feedback",
                    "Interview history"
                ],
                "button_text": "Upgrade to Pro"
            },
            {
                "id": 3,
                "name": "1:1 Mentor Plan",
                "price": 999,
                "currency": "BDT",
                "duration": "per session",
                "description": "One-to-one mentor session through WhatsApp.",
                "features": [
                    "Live mentor guidance",
                    "Resume review",
                    "Mock interview support",
                    "Career guidance",
                    "WhatsApp session"
                ],
                "button_text": "Book Mentor Session",
                "whatsapp_link": "https://wa.me/8801712345678"
            }
        ]
    }


@router.get("/mentor-contact")
def get_mentor_contact():
    return {
        "success": True,
        "plan_name": "1:1 Mentor Plan",
        "mentor_name": "Interview Mentor",
        "whatsapp_number": "+8801712345678",
        "whatsapp_link": "https://wa.me/8801712345678",
        "message": "Contact the mentor on WhatsApp to book a 1:1 session."
    }