-- 0009: Trigger for automatic thumb_count update (TRD Section 2.4)
CREATE OR REPLACE FUNCTION update_thumb_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE questions SET thumb_count = thumb_count + 1 WHERE id = NEW.question_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_thumb_count
AFTER INSERT ON thumbs
FOR EACH ROW EXECUTE FUNCTION update_thumb_count();
