from sqlalchemy.orm import Session

from classes.user import User
from classes.tag import Tag


def seed_database(session: Session):
    if session.query(User).count() > 0:
        return

    tags_data = [
        ("Zumba", "High-energy dance fitness"),
        ("Boxing", "Boxing fundamentals and conditioning"),
        ("Yoga", "Vinyasa flow and mindfulness"),
        ("Tennis", "Tennis technique and tactics"),
        ("Football", "Football skill development"),
        ("Gymnastics", "Core strength and floor routines"),
        ("Water Sports", "Swimming, SUP and water activities"),
        ("Jogging/Running", "Running mechanics and pacing"),
        ("Strength Training", "Hypertrophy and progressive overload"),
        ("Hiking", "Guided mountain navigation"),
        ("Combat Sports", "Self-defense and kickboxing"),
        ("Dance", "Contemporary and hip-hop dance"),
        ("Badminton", "Racket swing and court agility"),
        ("Rugby", "Rugby passing and defense"),
        ("Golf", "Golf swing and short-game"),
        ("Basketball", "Basketball shooting and dribbling"),
        ("Handball", "Handball coordination"),
        ("Table Tennis", "Table tennis reflexes"),
        ("Prenatal", "Safe maternal fitness"),
        ("Stretching", "Flexibility and recovery"),
        ("Cardio & HIIT", "Fat burn and endurance"),
        ("Island Water", "Island water sports"),
    ]

    created_tags = {}
    for name, desc in tags_data:
        existing = session.query(Tag).filter_by(name=name).first()
        if not existing:
            tag = Tag(name, desc)
            session.add(tag)
            created_tags[name] = tag
        else:
            created_tags[name] = existing
    session.flush()

    coaches = [
        ("Priya S.", "High-energy dance fitness sessions filled with rhythmic Latin and global beats.", "Zumba", 450),
        ("Cedric L.", "Focused pad work, boxing fundamentals, and intense conditioning drills.", "Boxing", 600),
        ("Leana Marou", "Vinyasa flow, pranayama, and core functional stability sessions on the beach.", "Yoga", 550),
        ("Sarah B.", "Individual coaching on serve dynamics, footwork, and tactical court play.", "Tennis", 750),
        ("Mathieu R.", "Skill development, technical drills, agility, and tactical preparation.", "Football", 400),
        ("Amisha K.", "Core strength, floor routines, and balance for all ages.", "Gymnastics", 650),
        ("Jean-Pierre S.", "Open water swimming progression and paddleboarding instruction.", "Water Sports", 700),
        ("Chloe A.", "Pacing, running mechanics, and base running conditioning.", "Jogging/Running", 350),
        ("Kavir D.", "Hypertrophy, postural alignment, and progressive overload.", "Strength Training", 500),
        ("Arnaud G.", "Guided mountain navigation and trail routing across the island.", "Hiking", 650),
        ("Gael B.", "Self-defense, kickboxing coordination, and mental conditioning.", "Combat Sports", 550),
        ("Ryan M.", "Contemporary and hip-hop. Rhythm and physical coordination.", "Dance", 450),
        ("Nicholas W.", "Improve racket swing mechanics and court coverage agility.", "Badminton", 480),
        ("Dev M.", "Passing accuracy, tactical sprint work, and defense structures.", "Rugby", 500),
        ("Robert T.", "Posture control, swing analytics, and short-game precision.", "Golf", 800),
        ("David L.", "Vertical jump programs, shooting dynamics, and handle drills.", "Basketball", 550),
        ("Melissa P.", "Throw accuracy, pivoting footwork, and defensive positioning.", "Handball", 450),
        ("Alan Y.", "Spin control, quick reflexes, and strategic shot placement.", "Table Tennis", 400),
    ]

    for name, desc, tag_name, price in coaches:
        tag = created_tags.get(tag_name)
        user = User(
            name=name, pwd="password123", is_coach=True,
            description=desc,
            tags=[tag] if tag else None,
            nickname=name.split(".")[0] if "." in name else name.split()[0],
            first_name=name.split()[0],
            last_name=" ".join(name.split()[1:]),
            email=f"{name.lower().replace(' ', '.').replace('.', '.')}@mocoach.mu",
        )
        if user.coach:
            user.coach.price_per_hour = price
        session.add(user)

    session.commit()
