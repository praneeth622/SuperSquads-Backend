-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "citext";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Insert some sample colleges for development
INSERT INTO colleges (id, name, domain, tier, location, website, is_active) VALUES
  (uuid_generate_v4(), 'Indian Institute of Technology Bombay', 'iitb.ac.in', '1', 'Mumbai', 'https://www.iitb.ac.in', true),
  (uuid_generate_v4(), 'Indian Institute of Technology Delhi', 'iitd.ac.in', '1', 'Delhi', 'https://www.iitd.ac.in', true),
  (uuid_generate_v4(), 'Indian Institute of Technology Madras', 'iitm.ac.in', '1', 'Chennai', 'https://www.iitm.ac.in', true),
  (uuid_generate_v4(), 'Indian Institute of Technology Kanpur', 'iitk.ac.in', '1', 'Kanpur', 'https://www.iitk.ac.in', true),
  (uuid_generate_v4(), 'Indian Institute of Technology Kharagpur', 'iitkgp.ac.in', '1', 'Kharagpur', 'https://www.iitkgp.ac.in', true),
  (uuid_generate_v4(), 'Indian Institute of Science', 'iisc.ac.in', '1', 'Bangalore', 'https://www.iisc.ac.in', true),
  (uuid_generate_v4(), 'Indian Institute of Technology Roorkee', 'iitr.ac.in', '1', 'Roorkee', 'https://www.iitr.ac.in', true),
  (uuid_generate_v4(), 'Indian Institute of Technology Guwahati', 'iitg.ac.in', '1', 'Guwahati', 'https://www.iitg.ac.in', true),
  (uuid_generate_v4(), 'National Institute of Technology Trichy', 'nitt.edu', '1', 'Trichy', 'https://www.nitt.edu', true),
  (uuid_generate_v4(), 'Delhi Technological University', 'dtu.ac.in', '1', 'Delhi', 'https://www.dtu.ac.in', true)
ON CONFLICT (domain) DO NOTHING;
