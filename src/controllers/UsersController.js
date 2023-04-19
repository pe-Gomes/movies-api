const knex = require("../database/knex");
const AppError = require("../utils/AppError");
const { hash, compare } = require("bcryptjs");

class UsersController {

  async create(request, response) {
    const { name, email, password } = request.body;

    const existingUsers = await knex.select("email").from("users")
    
    const checkUserExists = await existingUsers.some(user_email => user_email.email === email) 

    if (checkUserExists) {
      throw new AppError("Este e-mail já está sendo utilizado.");
    }

    const hashedPassword = await hash(password, 8);

    await knex("users").insert({
      name,
      email,
      password: hashedPassword
    })

    return response.status(201).json();
  }

  async delete(request, response) {
    const { id } = request.params;

    await knex("users").where({ id }).delete();

    return response.json();
  }

  async update(request, response) {
    const { name, email, password, old_password } = request.body;
    const { id } = request.params;

    const user = await knex
      .select("*")
      .from("users")
      .where({ id })
      .first()

    if (!user) {
      throw new AppError("O usuário não foi encontrado.");
    }

    const userUpdatedEmail = await knex
      .select("*")
      .from("users")
      .where({ email })
      .first()

      if (userUpdatedEmail && userUpdatedEmail.id !== user.id) {
        throw new AppError("Este e-mail já está cadastrado.");
      }

      user.name = name ?? user.name;
      user.email = email ?? user.email

      if (password && !old_password) {
        throw new AppError("VOcê precisa informar a senha antiga para definir uma nova senha.");
      }

      if (password && old_password) {
        const checkOldPassword = await compare(old_password, user.password);

        if (!checkOldPassword) {
          throw new AppError("A senha antiga não confere.")
        }
        
        user.password = await hash(password, 8);
      }

      await knex("users")
        .where({ id })
        .update({
          name: user.name,
          email: user.email,
          password: user.password
        })

      return response.status(200).json();
  }

}

module.exports = UsersController;