-- Function to create a profile for a new user.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.perfil_usuario (usuario_id, email_contato, nome_fazenda, cidade, estado, onboarding_completed, quick_tour_completed, quick_tour_skipped)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'nome_fazenda',
    'A definir',
    'SP',
    false,
    false,
    false
  );
  return new;
end;
$$;

-- Trigger to call the function when a new user signs up.
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
