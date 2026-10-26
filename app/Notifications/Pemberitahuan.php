<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/** Satu bentuk notifikasi untuk semua kejadian: pesan singkat dan tautan. Email hanya untuk pengingat masa berlaku. */
class Pemberitahuan extends Notification
{
    use Queueable;

    public function __construct(public string $pesan, public string $url, public bool $email = false) {}

    public function via(object $notifiable): array
    {
        return $this->email ? ['database', 'mail'] : ['database'];
    }

    public function toArray(object $notifiable): array
    {
        return ['pesan' => $this->pesan, 'url' => $this->url];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Pengingat JDIH PTGM')
            ->line($this->pesan)
            ->action('Buka dokumen', url($this->url));
    }
}
