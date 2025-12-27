INSERT INTO users (id, email, name, role, password_hash, avatar_url) 
VALUES ('admin-001', 'admin@drivetoonboard.co', 'Admin User', 'admin', 'd10e999ecd3b971c0eb770f94c4c937e:657fd0e2a3511120a3b1e391ff0ca00cbed1aa4d5518331f20df107549b7f0e25cf8723be96adc7863c041082963bf6fcca1416da06ae3afc1680e4ae222baf6', 'https://placehold.co/400x400/000000/FFFFFF.png?text=A')
ON CONFLICT(id) DO UPDATE SET email=excluded.email;
