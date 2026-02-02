export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      blocked_users: {
        Row: {
          blocked_id: string
          blocker_id: string
          created_at: string
          id: string
          reason: string | null
        }
        Insert: {
          blocked_id: string
          blocker_id: string
          created_at?: string
          id?: string
          reason?: string | null
        }
        Update: {
          blocked_id?: string
          blocker_id?: string
          created_at?: string
          id?: string
          reason?: string | null
        }
        Relationships: []
      }
      donor_availability: {
        Row: {
          created_at: string
          donor_id: string
          expires_at: string | null
          id: string
          status: Database["public"]["Enums"]["availability_status"]
        }
        Insert: {
          created_at?: string
          donor_id: string
          expires_at?: string | null
          id?: string
          status: Database["public"]["Enums"]["availability_status"]
        }
        Update: {
          created_at?: string
          donor_id?: string
          expires_at?: string | null
          id?: string
          status?: Database["public"]["Enums"]["availability_status"]
        }
        Relationships: [
          {
            foreignKeyName: "donor_availability_donor_id_fkey"
            columns: ["donor_id"]
            isOneToOne: false
            referencedRelation: "donors"
            referencedColumns: ["id"]
          },
        ]
      }
      donors: {
        Row: {
          blood_type: Database["public"]["Enums"]["blood_type"]
          created_at: string
          donation_locked_until: string | null
          id: string
          is_verified: boolean
          last_donation_date: string | null
          next_eligible_date: string | null
          profile_id: string
          status: Database["public"]["Enums"]["availability_status"]
          total_donations: number
          updated_at: string
          verification_notes: string | null
        }
        Insert: {
          blood_type: Database["public"]["Enums"]["blood_type"]
          created_at?: string
          donation_locked_until?: string | null
          id?: string
          is_verified?: boolean
          last_donation_date?: string | null
          next_eligible_date?: string | null
          profile_id: string
          status?: Database["public"]["Enums"]["availability_status"]
          total_donations?: number
          updated_at?: string
          verification_notes?: string | null
        }
        Update: {
          blood_type?: Database["public"]["Enums"]["blood_type"]
          created_at?: string
          donation_locked_until?: string | null
          id?: string
          is_verified?: boolean
          last_donation_date?: string | null
          next_eligible_date?: string | null
          profile_id?: string
          status?: Database["public"]["Enums"]["availability_status"]
          total_donations?: number
          updated_at?: string
          verification_notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "donors_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      emergency_requests: {
        Row: {
          blood_type: Database["public"]["Enums"]["blood_type"]
          contact_phone: string
          created_at: string
          expires_at: string | null
          hospital_name: string | null
          id: string
          latitude: number | null
          location_id: string | null
          longitude: number | null
          notes: string | null
          requester_id: string | null
          status: Database["public"]["Enums"]["emergency_status"]
          units_needed: number
          updated_at: string
          urgency: Database["public"]["Enums"]["emergency_urgency"]
        }
        Insert: {
          blood_type: Database["public"]["Enums"]["blood_type"]
          contact_phone: string
          created_at?: string
          expires_at?: string | null
          hospital_name?: string | null
          id?: string
          latitude?: number | null
          location_id?: string | null
          longitude?: number | null
          notes?: string | null
          requester_id?: string | null
          status?: Database["public"]["Enums"]["emergency_status"]
          units_needed?: number
          updated_at?: string
          urgency?: Database["public"]["Enums"]["emergency_urgency"]
        }
        Update: {
          blood_type?: Database["public"]["Enums"]["blood_type"]
          contact_phone?: string
          created_at?: string
          expires_at?: string | null
          hospital_name?: string | null
          id?: string
          latitude?: number | null
          location_id?: string | null
          longitude?: number | null
          notes?: string | null
          requester_id?: string | null
          status?: Database["public"]["Enums"]["emergency_status"]
          units_needed?: number
          updated_at?: string
          urgency?: Database["public"]["Enums"]["emergency_urgency"]
        }
        Relationships: [
          {
            foreignKeyName: "emergency_requests_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "emergency_requests_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      locations: {
        Row: {
          created_at: string
          id: string
          level: Database["public"]["Enums"]["location_level"]
          name: string
          parent_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          level: Database["public"]["Enums"]["location_level"]
          name: string
          parent_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          level?: Database["public"]["Enums"]["location_level"]
          name?: string
          parent_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "locations_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message: string
          related_id: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          related_id?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          related_id?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      phone_verifications: {
        Row: {
          attempts: number | null
          created_at: string
          expires_at: string
          id: string
          otp_code: string
          phone: string
          user_id: string
          verified: boolean | null
        }
        Insert: {
          attempts?: number | null
          created_at?: string
          expires_at: string
          id?: string
          otp_code: string
          phone: string
          user_id: string
          verified?: boolean | null
        }
        Update: {
          attempts?: number | null
          created_at?: string
          expires_at?: string
          id?: string
          otp_code?: string
          phone?: string
          user_id?: string
          verified?: boolean | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string
          id: string
          latitude: number | null
          location_id: string | null
          location_updated_at: string | null
          longitude: number | null
          phone: string | null
          phone_verified: boolean | null
          phone_verified_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name: string
          id?: string
          latitude?: number | null
          location_id?: string | null
          location_updated_at?: string | null
          longitude?: number | null
          phone?: string | null
          phone_verified?: boolean | null
          phone_verified_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string
          id?: string
          latitude?: number | null
          location_id?: string | null
          location_updated_at?: string | null
          longitude?: number | null
          phone?: string | null
          phone_verified?: boolean | null
          phone_verified_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          admin_notes: string | null
          created_at: string
          description: string | null
          id: string
          report_type: Database["public"]["Enums"]["report_type"]
          reported_emergency_id: string | null
          reported_user_id: string | null
          reporter_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["report_status"]
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          description?: string | null
          id?: string
          report_type: Database["public"]["Enums"]["report_type"]
          reported_emergency_id?: string | null
          reported_user_id?: string | null
          reporter_id: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["report_status"]
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          description?: string | null
          id?: string
          report_type?: Database["public"]["Enums"]["report_type"]
          reported_emergency_id?: string | null
          reported_user_id?: string | null
          reporter_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["report_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reports_reported_emergency_id_fkey"
            columns: ["reported_emergency_id"]
            isOneToOne: false
            referencedRelation: "emergency_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_distance_km: {
        Args: { lat1: number; lat2: number; lon1: number; lon2: number }
        Returns: number
      }
      check_and_expire_availability: { Args: never; Returns: undefined }
      find_nearby_donors: {
        Args: {
          max_distance_km?: number
          req_blood_type: Database["public"]["Enums"]["blood_type"]
          req_lat: number
          req_location_id: string
          req_lon: number
        }
        Returns: {
          blood_type: Database["public"]["Enums"]["blood_type"]
          distance_km: number
          donor_id: string
          full_name: string
          is_verified: boolean
          phone: string
          profile_id: string
          status: Database["public"]["Enums"]["availability_status"]
        }[]
      }
      get_current_profile_id: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      record_donation: { Args: { p_donor_id: string }; Returns: undefined }
    }
    Enums: {
      app_role: "donor" | "volunteer" | "admin"
      availability_status: "available" | "available_later" | "unavailable"
      blood_type: "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-"
      emergency_status: "pending" | "active" | "fulfilled" | "cancelled"
      emergency_urgency: "critical" | "urgent" | "standard"
      location_level: "village" | "tehsil" | "district"
      report_status: "pending" | "reviewed" | "resolved" | "dismissed"
      report_type:
        | "spam"
        | "fake_profile"
        | "harassment"
        | "inappropriate"
        | "other"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["donor", "volunteer", "admin"],
      availability_status: ["available", "available_later", "unavailable"],
      blood_type: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
      emergency_status: ["pending", "active", "fulfilled", "cancelled"],
      emergency_urgency: ["critical", "urgent", "standard"],
      location_level: ["village", "tehsil", "district"],
      report_status: ["pending", "reviewed", "resolved", "dismissed"],
      report_type: [
        "spam",
        "fake_profile",
        "harassment",
        "inappropriate",
        "other",
      ],
    },
  },
} as const
