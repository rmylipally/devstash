-- AlterTable
ALTER TABLE "User" ADD COLUMN     "editorPreferences" JSONB NOT NULL DEFAULT '{"fontSize":13,"tabSize":2,"wordWrap":true,"minimap":false,"theme":"vs-dark"}';
