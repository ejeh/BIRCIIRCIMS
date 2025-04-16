// import { UsersService } from './users/users.service';
// import { UserRole } from 'src/users/users.role.enum';
// import { hashPassword } from './auth/auth';

// export async function seedAdmin(usersService: UsersService) {
//   const existingAdmin = await usersService.findAdminByEmail('ejehgmail.com');
//   if (!existingAdmin) {
//     const password = 'magickiss17A#';
//     const hashedPassword = await hashPassword(password);
//     await usersService.create(
//       'Admin', // firstname
//       'User', // lastname
//       'ejehg@gmail.com', // email
//       hashedPassword, // password
//       1234567890, // phone
//       123456789, // NIN
//       UserRole.SUPER_ADMIN, // role
//       'System', // origin
//     );
//     console.log('Admin account created');
//   }
// }
