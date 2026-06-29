
-- Streams
CREATE TABLE public.streams (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.subjects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  stream_id UUID REFERENCES public.streams(id) ON DELETE CASCADE,
  icon TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.topics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.sub_topics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  topic_id UUID REFERENCES public.topics(id) ON DELETE CASCADE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.materials (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  type TEXT NOT NULL,
  url TEXT NOT NULL,
  sub_topic_id UUID REFERENCES public.sub_topics(id) ON DELETE CASCADE,
  year INT,
  file_size TEXT,
  duration TEXT,
  thumbnail_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.validate_material_type()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.type NOT IN ('pdf', 'video', 'pyq') THEN
    RAISE EXCEPTION 'Invalid material type: %. Must be pdf, video, or pyq', NEW.type;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_material_type
BEFORE INSERT OR UPDATE ON public.materials
FOR EACH ROW EXECUTE FUNCTION public.validate_material_type();

CREATE INDEX idx_subjects_stream ON public.subjects(stream_id);
CREATE INDEX idx_topics_subject ON public.topics(subject_id);
CREATE INDEX idx_sub_topics_topic ON public.sub_topics(topic_id);
CREATE INDEX idx_materials_sub_topic ON public.materials(sub_topic_id);
CREATE INDEX idx_materials_type ON public.materials(type);

ALTER TABLE public.streams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sub_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read streams" ON public.streams FOR SELECT USING (true);
CREATE POLICY "Anyone can read subjects" ON public.subjects FOR SELECT USING (true);
CREATE POLICY "Anyone can read topics" ON public.topics FOR SELECT USING (true);
CREATE POLICY "Anyone can read sub_topics" ON public.sub_topics FOR SELECT USING (true);
CREATE POLICY "Anyone can read materials" ON public.materials FOR SELECT USING (true);

-- Seed: Streams
INSERT INTO public.streams (id, name, description, icon) VALUES
  ('a1000000-0000-0000-0000-000000000001', 'Science PCM', 'Physics, Chemistry, Mathematics', '🔬'),
  ('a1000000-0000-0000-0000-000000000002', 'Science PCB', 'Physics, Chemistry, Biology', '🧬'),
  ('a1000000-0000-0000-0000-000000000003', 'Commerce', 'Accountancy, Economics, Business Studies', '📊'),
  ('a1000000-0000-0000-0000-000000000004', 'Arts / Humanities', 'History, Geography, Political Science', '🎨'),
  ('a1000000-0000-0000-0000-000000000005', 'Engineering', 'Computer Science, Electronics, Mechanical', '💻');

-- Seed: Subjects
INSERT INTO public.subjects (id, name, stream_id, icon, description) VALUES
  ('b1000000-0000-0000-0000-000000000001', 'Physics', 'a1000000-0000-0000-0000-000000000001', '⚡', 'Mechanics, Thermodynamics, Optics'),
  ('b1000000-0000-0000-0000-000000000002', 'Chemistry', 'a1000000-0000-0000-0000-000000000001', '🧪', 'Organic, Inorganic & Physical'),
  ('b1000000-0000-0000-0000-000000000003', 'Mathematics', 'a1000000-0000-0000-0000-000000000001', '📐', 'Calculus, Algebra, Trigonometry'),
  ('b1000000-0000-0000-0000-000000000004', 'Physics', 'a1000000-0000-0000-0000-000000000002', '⚡', 'Mechanics, Thermodynamics, Optics'),
  ('b1000000-0000-0000-0000-000000000005', 'Chemistry', 'a1000000-0000-0000-0000-000000000002', '🧪', 'Organic, Inorganic & Physical'),
  ('b1000000-0000-0000-0000-000000000006', 'Biology', 'a1000000-0000-0000-0000-000000000002', '🧬', 'Botany, Zoology, Genetics'),
  ('b1000000-0000-0000-0000-000000000007', 'Accountancy', 'a1000000-0000-0000-0000-000000000003', '📒', 'Financial Accounting'),
  ('b1000000-0000-0000-0000-000000000008', 'Economics', 'a1000000-0000-0000-0000-000000000003', '📈', 'Micro & Macro Economics'),
  ('b1000000-0000-0000-0000-000000000009', 'Business Studies', 'a1000000-0000-0000-0000-000000000003', '💼', 'Management & Marketing'),
  ('b1000000-0000-0000-0000-000000000010', 'History', 'a1000000-0000-0000-0000-000000000004', '📜', 'Indian & World History'),
  ('b1000000-0000-0000-0000-000000000011', 'Geography', 'a1000000-0000-0000-0000-000000000004', '🌍', 'Physical & Human Geography'),
  ('b1000000-0000-0000-0000-000000000012', 'Political Science', 'a1000000-0000-0000-0000-000000000004', '🏛️', 'Indian Polity'),
  ('b1000000-0000-0000-0000-000000000013', 'Computer Science', 'a1000000-0000-0000-0000-000000000005', '💻', 'DSA, OS, DBMS'),
  ('b1000000-0000-0000-0000-000000000014', 'Electronics', 'a1000000-0000-0000-0000-000000000005', '🔌', 'Circuits, Signals'),
  ('b1000000-0000-0000-0000-000000000015', 'Mathematics', 'a1000000-0000-0000-0000-000000000005', '📐', 'Engineering Mathematics');

-- Seed: Topics for Physics PCM
INSERT INTO public.topics (id, name, subject_id, description) VALUES
  ('c1000000-0000-0000-0000-000000000001', 'Mechanics', 'b1000000-0000-0000-0000-000000000001', 'Motion, Forces, Energy'),
  ('c1000000-0000-0000-0000-000000000002', 'Thermodynamics', 'b1000000-0000-0000-0000-000000000001', 'Heat, Temperature, Laws'),
  ('c1000000-0000-0000-0000-000000000003', 'Optics', 'b1000000-0000-0000-0000-000000000001', 'Light, Lenses, Mirrors'),
  ('c1000000-0000-0000-0000-000000000004', 'Organic Chemistry', 'b1000000-0000-0000-0000-000000000002', 'Hydrocarbons, Reactions'),
  ('c1000000-0000-0000-0000-000000000005', 'Inorganic Chemistry', 'b1000000-0000-0000-0000-000000000002', 'Periodic Table, Bonding'),
  ('c1000000-0000-0000-0000-000000000006', 'Physical Chemistry', 'b1000000-0000-0000-0000-000000000002', 'Equilibrium, Kinetics'),
  ('c1000000-0000-0000-0000-000000000007', 'Calculus', 'b1000000-0000-0000-0000-000000000003', 'Limits, Derivatives, Integrals'),
  ('c1000000-0000-0000-0000-000000000008', 'Algebra', 'b1000000-0000-0000-0000-000000000003', 'Equations, Matrices'),
  ('c1000000-0000-0000-0000-000000000009', 'Trigonometry', 'b1000000-0000-0000-0000-000000000003', 'Identities, Functions');

-- Seed: Sub-topics
INSERT INTO public.sub_topics (id, name, topic_id, description) VALUES
  ('d1000000-0000-0000-0000-000000000001', 'Newton''s Laws of Motion', 'c1000000-0000-0000-0000-000000000001', 'Three laws and applications'),
  ('d1000000-0000-0000-0000-000000000002', 'Projectile Motion', 'c1000000-0000-0000-0000-000000000001', 'Trajectory, Range'),
  ('d1000000-0000-0000-0000-000000000003', 'Work, Energy & Power', 'c1000000-0000-0000-0000-000000000001', 'Conservation of energy'),
  ('d1000000-0000-0000-0000-000000000004', 'Laws of Thermodynamics', 'c1000000-0000-0000-0000-000000000002', 'Zeroth, First, Second laws'),
  ('d1000000-0000-0000-0000-000000000005', 'Heat Transfer', 'c1000000-0000-0000-0000-000000000002', 'Conduction, Convection, Radiation'),
  ('d1000000-0000-0000-0000-000000000006', 'Hydrocarbons', 'c1000000-0000-0000-0000-000000000004', 'Alkanes, Alkenes, Alkynes'),
  ('d1000000-0000-0000-0000-000000000007', 'Alcohols & Phenols', 'c1000000-0000-0000-0000-000000000004', 'Classification, Reactions'),
  ('d1000000-0000-0000-0000-000000000008', 'Limits & Continuity', 'c1000000-0000-0000-0000-000000000007', 'Limit theorems'),
  ('d1000000-0000-0000-0000-000000000009', 'Differentiation', 'c1000000-0000-0000-0000-000000000007', 'Rules, Chain rule');

-- Seed: Materials
INSERT INTO public.materials (title, type, url, sub_topic_id, file_size, year, duration) VALUES
  ('Newton''s Laws Complete Notes', 'pdf', '#pdf-placeholder', 'd1000000-0000-0000-0000-000000000001', '2.4 MB', NULL, NULL),
  ('Newton''s Laws Explained', 'video', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'd1000000-0000-0000-0000-000000000001', NULL, NULL, '12:30'),
  ('JEE 2023 Mechanics Q1-5', 'pyq', '#pyq-placeholder', 'd1000000-0000-0000-0000-000000000001', '1.2 MB', 2023, NULL),
  ('JEE 2022 Newton''s Laws', 'pyq', '#pyq-placeholder', 'd1000000-0000-0000-0000-000000000001', '980 KB', 2022, NULL),
  ('Projectile Motion Theory', 'pdf', '#pdf-placeholder', 'd1000000-0000-0000-0000-000000000002', '1.8 MB', NULL, NULL),
  ('Projectile Motion Visual Guide', 'video', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'd1000000-0000-0000-0000-000000000002', NULL, NULL, '15:00'),
  ('Hydrocarbons NCERT Summary', 'pdf', '#pdf-placeholder', 'd1000000-0000-0000-0000-000000000006', '3.1 MB', NULL, NULL),
  ('Organic Reactions Masterclass', 'video', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'd1000000-0000-0000-0000-000000000006', NULL, NULL, '22:00'),
  ('Limits & Continuity Notes', 'pdf', '#pdf-placeholder', 'd1000000-0000-0000-0000-000000000008', '2.0 MB', NULL, NULL),
  ('Differentiation Quick Revision', 'pdf', '#pdf-placeholder', 'd1000000-0000-0000-0000-000000000009', '1.5 MB', NULL, NULL),
  ('Calculus Full Course', 'video', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'd1000000-0000-0000-0000-000000000009', NULL, NULL, '45:00'),
  ('Work Energy Power Notes', 'pdf', '#pdf-placeholder', 'd1000000-0000-0000-0000-000000000003', '2.2 MB', NULL, NULL),
  ('Thermodynamics Laws PDF', 'pdf', '#pdf-placeholder', 'd1000000-0000-0000-0000-000000000004', '1.9 MB', NULL, NULL),
  ('Heat Transfer Explained', 'video', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'd1000000-0000-0000-0000-000000000005', NULL, NULL, '18:00'),
  ('Alcohols Phenols Notes', 'pdf', '#pdf-placeholder', 'd1000000-0000-0000-0000-000000000007', '2.5 MB', NULL, NULL);
