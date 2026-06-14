CREATE TABLE IF NOT EXISTS user_credits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) UNIQUE NOT NULL,
  credits_remaining int NOT NULL DEFAULT 3 CHECK (credits_remaining >= 0),
  credits_total_purchased int NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_credits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own credits" ON user_credits FOR SELECT USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS credit_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  amount int NOT NULL,
  reason text NOT NULL,
  stripe_session_id text,
  recommendation_id uuid,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own transactions" ON credit_transactions FOR SELECT USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION deduct_credits(p_user_id uuid, p_amount int, p_reason text, p_recommendation_id uuid DEFAULT NULL)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current int;
BEGIN
  SELECT credits_remaining INTO v_current FROM user_credits WHERE user_id = p_user_id FOR UPDATE;
  IF v_current IS NULL OR v_current < p_amount THEN RETURN false; END IF;
  UPDATE user_credits SET credits_remaining = credits_remaining - p_amount, updated_at = now() WHERE user_id = p_user_id;
  INSERT INTO credit_transactions (user_id, amount, reason, recommendation_id) VALUES (p_user_id, -p_amount, p_reason, p_recommendation_id);
  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION add_credits(p_user_id uuid, p_amount int, p_reason text, p_stripe_session_id text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO user_credits (user_id, credits_remaining, credits_total_purchased)
    VALUES (p_user_id, p_amount, CASE WHEN p_reason LIKE 'pack_%' THEN p_amount ELSE 0 END)
    ON CONFLICT (user_id) DO UPDATE SET
      credits_remaining = user_credits.credits_remaining + p_amount,
      credits_total_purchased = user_credits.credits_total_purchased + CASE WHEN p_reason LIKE 'pack_%' THEN p_amount ELSE 0 END,
      updated_at = now();
  INSERT INTO credit_transactions (user_id, amount, reason, stripe_session_id) VALUES (p_user_id, p_amount, p_reason, p_stripe_session_id);
END;
$$;

CREATE OR REPLACE FUNCTION handle_new_user_credits()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM add_credits(NEW.id, 3, 'signup_grant');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_credits ON auth.users;
CREATE TRIGGER on_auth_user_created_credits
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user_credits();
