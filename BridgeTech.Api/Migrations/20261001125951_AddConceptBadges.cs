using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BridgeTech.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddConceptBadges : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                ALTER TABLE public.quizzes
                ADD COLUMN IF NOT EXISTS lesson_id uuid;
                """);

            migrationBuilder.Sql("""
                CREATE TABLE IF NOT EXISTS public.badges (
                    badge_id uuid NOT NULL DEFAULT gen_random_uuid(),
                    user_id uuid NOT NULL,
                    lesson_id uuid NOT NULL,
                    awarded_at timestamp with time zone NOT NULL DEFAULT now(),
                    CONSTRAINT pk_badges PRIMARY KEY (badge_id)
                );
                """);

            migrationBuilder.Sql("""
                CREATE INDEX IF NOT EXISTS ix_quizzes_lesson_id
                    ON public.quizzes (lesson_id);
                CREATE INDEX IF NOT EXISTS ix_badges_lesson_id
                    ON public.badges (lesson_id);
                CREATE INDEX IF NOT EXISTS ix_badges_user_id
                    ON public.badges (user_id);
                CREATE UNIQUE INDEX IF NOT EXISTS ix_badges_user_id_lesson_id
                    ON public.badges (user_id, lesson_id);
                """);

            migrationBuilder.Sql("""
                DO $$
                BEGIN
                    IF NOT EXISTS (
                        SELECT 1
                        FROM pg_constraint
                        WHERE conname = 'fk_badges_lessons_lesson_id'
                    ) THEN
                        ALTER TABLE public.badges
                        ADD CONSTRAINT fk_badges_lessons_lesson_id
                        FOREIGN KEY (lesson_id) REFERENCES public.lessons (lesson_id)
                        ON DELETE CASCADE;
                    END IF;
                    IF NOT EXISTS (
                        SELECT 1
                        FROM pg_constraint
                        WHERE conname = 'fk_badges_users_user_id'
                    ) THEN
                        ALTER TABLE public.badges
                        ADD CONSTRAINT fk_badges_users_user_id
                        FOREIGN KEY (user_id) REFERENCES public.users (user_id)
                        ON DELETE CASCADE;
                    END IF;
                    IF NOT EXISTS (
                        SELECT 1
                        FROM pg_constraint
                        WHERE conname = 'fk_quizzes_lessons_lesson_id'
                    ) THEN
                        ALTER TABLE public.quizzes
                        ADD CONSTRAINT fk_quizzes_lessons_lesson_id
                        FOREIGN KEY (lesson_id) REFERENCES public.lessons (lesson_id);
                    END IF;
                END $$;
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "fk_quizzes_lessons_lesson_id",
                schema: "public",
                table: "quizzes");

            migrationBuilder.DropTable(
                name: "badges",
                schema: "public");

            migrationBuilder.DropIndex(
                name: "ix_quizzes_lesson_id",
                schema: "public",
                table: "quizzes");

            migrationBuilder.DropColumn(
                name: "lesson_id",
                schema: "public",
                table: "quizzes");
        }
    }
}
