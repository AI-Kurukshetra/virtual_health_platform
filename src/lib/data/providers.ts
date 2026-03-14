import { createClient, createServiceRoleClient } from "@/lib/supabase/server";

function isDuplicateAuthError(message: string) {
  const lowered = message.toLowerCase();

  return (
    lowered.includes("already registered") ||
    lowered.includes("already exists") ||
    lowered.includes("user already") ||
    lowered.includes("duplicate")
  );
}

async function cleanupAuthUser(admin: ReturnType<typeof createServiceRoleClient>, userId: string) {
  try {
    await admin.auth.admin.deleteUser(userId);
  } catch {
    // Best-effort rollback.
  }
}

export async function listProviders(organizationId: string) {
  const supabase = await createClient();

  const { data } = await supabase
    .from("providers")
    .select(
      "id, profile_id, specialty, license_number, timezone, bio, profile:profiles(full_name, email)",
    )
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: true });

  return (data ?? []).map((provider) => ({
    ...provider,
    profile: Array.isArray(provider.profile) ? provider.profile[0] : provider.profile,
  }));
}

export async function listProviderRoster(organizationId: string) {
  const supabase = await createClient();

  const [{ data: memberships }, providers] = await Promise.all([
    supabase
      .from("memberships")
      .select("profile_id, profile:profiles(full_name, email)")
      .eq("organization_id", organizationId)
      .eq("role", "provider")
      .eq("status", "active")
      .order("created_at", { ascending: true }),
    listProviders(organizationId),
  ]);

  const providerMap = new Map(providers.map((provider) => [provider.profile_id, provider]));

  return (memberships ?? []).map((membership) => {
    const profile = Array.isArray(membership.profile) ? membership.profile[0] : membership.profile;
    const provider = providerMap.get(membership.profile_id) ?? null;

    return {
      profileId: membership.profile_id,
      fullName: profile?.full_name ?? "Provider",
      email: profile?.email ?? null,
      provider,
    };
  });
}

export async function getProviderByProfile(organizationId: string, profileId: string) {
  const supabase = await createClient();

  const { data } = await supabase
    .from("providers")
    .select("id, profile_id, specialty, license_number, timezone, bio")
    .eq("organization_id", organizationId)
    .eq("profile_id", profileId)
    .maybeSingle();

  return data;
}

export async function getProviderByProfileId(organizationId: string, profileId: string) {
  return getProviderByProfile(organizationId, profileId);
}

export async function getProviderAvailability(organizationId: string, providerId: string) {
  const supabase = await createClient();

  const { data } = await supabase
    .from("provider_availability")
    .select("id, provider_id, day_of_week, start_time, end_time, slot_minutes, is_active")
    .eq("organization_id", organizationId)
    .eq("provider_id", providerId)
    .order("day_of_week", { ascending: true })
    .order("start_time", { ascending: true });

  return data ?? [];
}

export async function listAllAvailabilityForOrg(organizationId: string) {
  const supabase = await createClient();

  const { data } = await supabase
    .from("provider_availability")
    .select("id, provider_id, day_of_week, start_time, end_time, slot_minutes, is_active")
    .eq("organization_id", organizationId)
    .eq("is_active", true)
    .order("day_of_week", { ascending: true });

  return data ?? [];
}

export async function upsertProviderProfile({
  organizationId,
  profileId,
  specialty,
  licenseNumber,
  timezone,
  bio,
}: {
  organizationId: string;
  profileId: string;
  specialty: string | null;
  licenseNumber: string | null;
  timezone: string;
  bio: string | null;
}) {
  const supabase = await createClient();

  const { error } = await supabase.from("providers").upsert(
    {
      organization_id: organizationId,
      profile_id: profileId,
      specialty,
      license_number: licenseNumber,
      timezone,
      bio,
    },
    { onConflict: "organization_id,profile_id" },
  );

  if (error) {
    throw new Error(error.message);
  }
}

export async function createProviderAccount({
  organizationId,
  actorProfileId,
  fullName,
  email,
  password,
  specialty,
  licenseNumber,
  timezone,
  bio,
}: {
  organizationId: string;
  actorProfileId: string;
  fullName: string;
  email: string;
  password: string;
  specialty: string | null;
  licenseNumber: string | null;
  timezone: string;
  bio: string | null;
}) {
  const admin = createServiceRoleClient();

  const { data: createdUser, error: createUserError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: fullName,
      role: "provider",
    },
  });

  if (createUserError || !createdUser.user?.id) {
    if (isDuplicateAuthError(createUserError?.message ?? "")) {
      throw new Error("A user with this email already exists.");
    }

    throw new Error(createUserError?.message ?? "Unable to create provider login.");
  }

  const userId = createdUser.user.id;

  try {
    const { error: profileError } = await admin.from("profiles").upsert(
      {
        id: userId,
        full_name: fullName,
        email,
        global_role: "provider",
      },
      { onConflict: "id" },
    );

    if (profileError) {
      throw new Error(profileError.message);
    }

    const { error: membershipError } = await admin.from("memberships").upsert(
      {
        organization_id: organizationId,
        profile_id: userId,
        role: "provider",
        status: "active",
      },
      { onConflict: "organization_id,profile_id" },
    );

    if (membershipError) {
      throw new Error(membershipError.message);
    }

    const { data: provider, error: providerError } = await admin
      .from("providers")
      .insert({
        organization_id: organizationId,
        profile_id: userId,
        specialty,
        license_number: licenseNumber,
        timezone,
        bio,
      })
      .select("id")
      .single();

    if (providerError || !provider) {
      throw new Error(providerError?.message ?? "Unable to create provider profile.");
    }

    await admin.from("audit_logs").insert({
      organization_id: organizationId,
      actor_profile_id: actorProfileId,
      entity_type: "providers",
      entity_id: provider.id,
      action: "provider.created",
      metadata: {
        profile_id: userId,
        email,
      },
    });

    return {
      providerId: provider.id,
      profileId: userId,
    };
  } catch (error) {
    await cleanupAuthUser(admin, userId);
    throw error;
  }
}

export async function addAvailabilityEntry({
  organizationId,
  providerId,
  dayOfWeek,
  startTime,
  endTime,
  slotMinutes,
}: {
  organizationId: string;
  providerId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  slotMinutes: number;
}) {
  const supabase = await createClient();

  const { error } = await supabase.from("provider_availability").insert({
    organization_id: organizationId,
    provider_id: providerId,
    day_of_week: dayOfWeek,
    start_time: startTime,
    end_time: endTime,
    slot_minutes: slotMinutes,
    is_active: true,
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function deleteAvailabilityEntry(organizationId: string, availabilityId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("provider_availability")
    .delete()
    .eq("organization_id", organizationId)
    .eq("id", availabilityId);

  if (error) {
    throw new Error(error.message);
  }
}
