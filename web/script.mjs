import fs from "fs";
const files = [
  "d:\\38. GofiberV3\\gorm-zed\\web\\src\\pages\\UserManagement.tsx",
  "d:\\38. GofiberV3\\gorm-zed\\web\\src\\pages\\Register.tsx",
  "d:\\38. GofiberV3\\gorm-zed\\web\\src\\pages\\Login.tsx",
  "d:\\38. GofiberV3\\gorm-zed\\web\\src\\pages\\Dashboard.tsx",
];
for (const file of files) {
  let content = fs.readFileSync(file, "utf8");
  content = content.replace(
    /\{f?ield\.state\.meta\.errors\.join\(\", \"\)\}/g,
    "{field.state.meta.errors.map((e: any) => typeof e === 'string' ? e : e.message || String(e)).join(', ')}",
  );
  fs.writeFileSync(file, content);
}
