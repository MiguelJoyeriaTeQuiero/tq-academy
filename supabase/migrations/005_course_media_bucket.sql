-- ============================================================
-- TQ Academy — Bucket de medios para cursos/lecciones
-- ============================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('course-media', 'course-media', true)
ON CONFLICT (id) DO NOTHING;

-- Lectura: cualquier usuario autenticado
CREATE POLICY "course_media_read_auth" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'course-media'
    AND auth.role() = 'authenticated'
  );

-- Subida: solo admins
CREATE POLICY "course_media_insert_admin" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'course-media'
    AND get_user_rol() IN ('super_admin', 'admin_rrhh')
  );

-- Actualización/borrado: solo admins
CREATE POLICY "course_media_update_admin" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'course-media'
    AND get_user_rol() IN ('super_admin', 'admin_rrhh')
  );

CREATE POLICY "course_media_delete_admin" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'course-media'
    AND get_user_rol() IN ('super_admin', 'admin_rrhh')
  );
