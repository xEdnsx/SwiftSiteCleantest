<?php

namespace App\Mail;

use Illuminate\Mail\Mailable;

class ReclamarCuenta extends Mailable
{
    public function __construct(public readonly string $codigo) {}

    public function build(): static
    {
        return $this->subject('Verifica tu cuenta de SwiftSite Clean')->text('mail.reclamar-cuenta');
    }
}
