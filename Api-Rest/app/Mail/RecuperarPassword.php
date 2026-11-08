<?php

namespace App\Mail;

use Illuminate\Mail\Mailable;

class RecuperarPassword extends Mailable
{
    public function __construct(public readonly string $codigo) {}

    public function build(): static
    {
        return $this->subject('Recupera tu acceso a SwiftSite Clean')->text('mail.recuperar-password');
    }
}
